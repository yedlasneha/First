package com.sneha.KSR_Fruits.auth.application.service;

import com.sneha.KSR_Fruits.auth.domain.model.User;
import com.sneha.KSR_Fruits.auth.domain.repository.UserRepository;
import com.sneha.KSR_Fruits.auth.infrastructure.persistence.entity.OtpEntity;
import com.sneha.KSR_Fruits.auth.infrastructure.persistence.repository.JpaOtpRepository;
import com.sneha.KSR_Fruits.auth.infrastructure.security.JwtProvider;
import com.sneha.KSR_Fruits.common.exception.BusinessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    // Admin email — only this email can access the admin portal
    private static final String ADMIN_EMAIL = "ksrfruitshelp@gmail.com";

    private static final int MAX_ATTEMPTS   = 3;
    private static final int OTP_EXPIRY_MIN = 5;
    private static final int RESEND_COOLDOWN_SEC = 30;

    // Rate-limit: track last OTP send time per email (in-memory, lightweight)
    private final Map<String, LocalDateTime> lastSentAt = new ConcurrentHashMap<>();

    private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();

    private final UserRepository userRepository;
    private final JpaOtpRepository otpRepository;
    private final JwtProvider jwtProvider;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${otp.mock.enabled:false}")
    private boolean mockOtpEnabled;

    public AuthService(UserRepository userRepository,
                       JpaOtpRepository otpRepository,
                       JwtProvider jwtProvider,
                       JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.otpRepository  = otpRepository;
        this.jwtProvider    = jwtProvider;
        this.mailSender     = mailSender;
    }

    // ── Send OTP (user) ───────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> sendOtp(String email) {
        email = normalizeEmail(email);
        validateEmail(email);
        enforceResendCooldown(email);

        String otp = generateOtp();
        saveOtp(email, otp);
        sendOtpEmail(email, otp, false);
        lastSentAt.put(email, LocalDateTime.now());

        log.info("OTP sent to email={}", email);
        Map<String, Object> res = new HashMap<>();
        res.put("message", "OTP sent to " + maskEmail(email));
        res.put("email", email);
        if (mockOtpEnabled) res.put("devOtp", otp); // dev only
        return res;
    }

    @Transactional
    public Map<String, Object> verifyOtp(String email, String otp) {
        email = normalizeEmail(email);
        validateEmail(email);
        verifyOtpCode(email, otp);

        final String finalEmail = email;
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User u = new User();
            u.setEmail(finalEmail);
            u.setRole("USER");
            u.setProfileComplete(false);
            u.setCreatedAt(LocalDateTime.now());
            u.setUpdatedAt(LocalDateTime.now());
            return userRepository.save(u);
        });

        otpRepository.deleteByEmail(email);
        lastSentAt.remove(email);
        log.info("User login: email={} userId={}", email, user.getId());
        return buildAuthResponse(user);
    }

    // ── Send OTP (admin) ──────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> sendAdminOtp(String email) {
        email = normalizeEmail(email);
        validateEmail(email);

        if (!ADMIN_EMAIL.equalsIgnoreCase(email)) {
            log.warn("Admin access denied for email={}", email);
            throw new BusinessException("Access denied. This email is not authorized for admin access.");
        }

        enforceResendCooldown(email);

        String otp = generateOtp();
        saveOtp(email, otp);
        sendOtpEmail(email, otp, true);
        lastSentAt.put(email, LocalDateTime.now());

        log.info("Admin OTP sent to email={}", email);
        Map<String, Object> res = new HashMap<>();
        res.put("message", "Admin OTP sent to " + maskEmail(email));
        res.put("email", email);
        if (mockOtpEnabled) res.put("devOtp", otp);
        return res;
    }

    @Transactional
    public Map<String, Object> verifyAdminOtp(String email, String otp) {
        email = normalizeEmail(email);
        validateEmail(email);

        if (!ADMIN_EMAIL.equalsIgnoreCase(email)) {
            throw new BusinessException("Access denied.");
        }
        verifyOtpCode(email, otp);

        final String finalEmail = email;
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User u = new User();
            u.setEmail(finalEmail);
            u.setRole("ADMIN");
            u.setProfileComplete(true);
            u.setName("Admin");
            u.setCreatedAt(LocalDateTime.now());
            u.setUpdatedAt(LocalDateTime.now());
            return userRepository.save(u);
        });

        if (!"ADMIN".equals(user.getRole())) {
            user.setRole("ADMIN");
            user.setProfileComplete(true);
            user = userRepository.save(user);
        }

        otpRepository.deleteByEmail(email);
        lastSentAt.remove(email);
        log.info("Admin login: email={} userId={}", email, user.getId());
        return buildAuthResponse(user);
    }

    // ── Profile ───────────────────────────────────────────────────────────

    public Map<String, Object> getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("User not found"));
        return buildProfileResponse(user);
    }

    public Map<String, Object> saveProfile(Long userId, String name, String email,
                                            String address, String receiverName, String receiverMobile) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("User not found"));

        if (name == null || name.isBlank()) throw new BusinessException("Name is required");
        if (address == null || address.isBlank()) throw new BusinessException("Delivery address is required");

        user.setName(name.trim());
        if (email != null && !email.isBlank()) user.setEmail(email.trim().toLowerCase());
        user.setAddress(address.trim());
        user.setReceiverName(receiverName != null ? receiverName.trim() : name.trim());
        user.setReceiverMobile(receiverMobile != null ? receiverMobile.trim() : null);
        user.setProfileComplete(true);
        user.setUpdatedAt(LocalDateTime.now());

        try {
            user = userRepository.save(user);
        } catch (Exception e) {
            throw new BusinessException("Failed to save profile. Please try again.");
        }

        log.info("Profile saved for userId={}", userId);
        return buildProfileResponse(user);
    }

    // ── Admin: List Users ─────────────────────────────────────────────────

    public List<Map<String, Object>> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::buildProfileResponse)
                .collect(Collectors.toList());
    }

    // ── Token Validation ──────────────────────────────────────────────────

    public Map<String, Object> validateToken(String token) {
        if (!jwtProvider.isTokenValid(token)) {
            throw new BusinessException("Invalid or expired token");
        }
        Long userId = jwtProvider.extractUserId(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("User not found"));

        Map<String, Object> res = new HashMap<>();
        res.put("valid", true);
        res.put("userId", user.getId());
        res.put("email", user.getEmail());
        res.put("role", user.getRole());
        res.put("profileComplete", user.getProfileComplete());
        return res;
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private void validateEmail(String email) {
        if (email == null || !email.matches("^[\\w.+\\-]+@[\\w\\-]+\\.[a-z]{2,}$")) {
            throw new BusinessException("Invalid email address.");
        }
        // Production: verify the domain has valid MX records
        String domain = email.substring(email.indexOf('@') + 1);
        try {
            javax.naming.directory.InitialDirContext idc = new javax.naming.directory.InitialDirContext();
            javax.naming.directory.Attributes attrs = idc.getAttributes(
                "dns:/" + domain, new String[]{"MX"});
            javax.naming.directory.Attribute mx = attrs.get("MX");
            if (mx == null || mx.size() == 0) {
                throw new BusinessException("Email domain does not exist or cannot receive emails.");
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            // DNS lookup failed (network issue) — allow through in dev, log warning
            log.warn("MX lookup failed for domain {}: {}", domain, e.getMessage());
        }
    }

    private void enforceResendCooldown(String email) {
        LocalDateTime last = lastSentAt.get(email);
        if (last != null && last.plusSeconds(RESEND_COOLDOWN_SEC).isAfter(LocalDateTime.now())) {
            long wait = java.time.Duration.between(LocalDateTime.now(), last.plusSeconds(RESEND_COOLDOWN_SEC)).getSeconds();
            throw new BusinessException("Please wait " + wait + " seconds before requesting a new OTP.");
        }
    }

    private void saveOtp(String email, String otp) {
        // Delete any existing OTP for this email
        otpRepository.deleteByEmail(email);
        String hash = bcrypt.encode(otp);
        otpRepository.save(new OtpEntity(email, hash, LocalDateTime.now().plusMinutes(OTP_EXPIRY_MIN)));
    }

    private void verifyOtpCode(String email, String otp) {
        OtpEntity entry = otpRepository.findTopByEmailOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new BusinessException("OTP not found. Please request a new OTP."));

        if (LocalDateTime.now().isAfter(entry.getExpiresAt())) {
            otpRepository.deleteByEmail(email);
            throw new BusinessException("OTP expired. Please request a new OTP.");
        }
        if (entry.getAttempts() >= MAX_ATTEMPTS) {
            otpRepository.deleteByEmail(email);
            throw new BusinessException("Too many failed attempts. Please request a new OTP.");
        }
        if (!bcrypt.matches(otp, entry.getOtpHash())) {
            entry.setAttempts(entry.getAttempts() + 1);
            otpRepository.save(entry);
            int remaining = MAX_ATTEMPTS - entry.getAttempts();
            throw new BusinessException("Invalid OTP. " + (remaining > 0 ? remaining + " attempt(s) remaining." : "Please request a new OTP."));
        }
    }

    private void sendOtpEmail(String to, String otp, boolean isAdmin) {
        if (mockOtpEnabled) {
            log.info("[DEV MOCK] OTP for {} = {}", to, otp);
            return; // skip real email in dev mode
        }
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(isAdmin ? "KSR Fruits Admin OTP" : "KSR Fruits Login OTP");
            String html = buildEmailHtml(otp, isAdmin);
            helper.setText(html, true);
            mailSender.send(msg);
            log.info("OTP email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", to, e.getMessage());
            throw new BusinessException("Failed to send OTP email. Please try again.");
        }
    }

    private String buildEmailHtml(String otp, boolean isAdmin) {
        String title = isAdmin ? "Admin Login OTP" : "Your Login OTP";
        return """
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
              <div style="text-align:center;margin-bottom:24px;">
                <h2 style="color:#16a34a;margin:0;">🍎 KSR Fruits</h2>
                <p style="color:#6b7280;margin:4px 0 0;">%s</p>
              </div>
              <div style="background:#fff;border-radius:10px;padding:24px;text-align:center;border:1px solid #e5e7eb;">
                <p style="color:#374151;margin:0 0 16px;">Your one-time password is:</p>
                <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#111827;background:#f0fdf4;padding:16px;border-radius:8px;border:2px dashed #16a34a;">
                  %s
                </div>
                <p style="color:#6b7280;font-size:13px;margin:16px 0 0;">
                  Valid for <strong>5 minutes</strong>. Do not share this OTP with anyone.
                </p>
              </div>
              <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:16px;">
                If you didn't request this, please ignore this email.
              </p>
            </div>
            """.formatted(title, otp);
    }

    private String generateOtp() {
        return String.format("%06d", new Random().nextInt(999999));
    }

    private String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 2) return email;
        return email.charAt(0) + "***" + email.substring(at - 1);
    }

    private Map<String, Object> buildAuthResponse(User user) {
        String token = jwtProvider.generateToken(user.getEmail(), user.getId(), user.getRole());
        Map<String, Object> res = new HashMap<>();
        res.put("token", token);
        res.put("userId", user.getId());
        res.put("email", user.getEmail());
        res.put("name", user.getName());
        res.put("phone", user.getPhone());
        res.put("address", user.getAddress());
        res.put("receiverName", user.getReceiverName());
        res.put("receiverMobile", user.getReceiverMobile());
        res.put("role", user.getRole());
        res.put("profileComplete", user.getProfileComplete() != null ? user.getProfileComplete() : false);
        return res;
    }

    private Map<String, Object> buildProfileResponse(User user) {
        Map<String, Object> res = new HashMap<>();
        res.put("userId", user.getId());
        res.put("email", user.getEmail());
        res.put("name", user.getName());
        res.put("phone", user.getPhone());
        res.put("address", user.getAddress());
        res.put("receiverName", user.getReceiverName());
        res.put("receiverMobile", user.getReceiverMobile());
        res.put("role", user.getRole());
        res.put("profileComplete", user.getProfileComplete() != null ? user.getProfileComplete() : false);
        return res;
    }
}
