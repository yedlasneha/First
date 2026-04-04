package com.sneha.KSR_Fruits.auth.infrastructure.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Component
public class RateLimitingInterceptor implements HandlerInterceptor {

    // key -> last request timestamp
    private final ConcurrentHashMap<String, Long> otpRequestCache = new ConcurrentHashMap<>();
    // key -> failed attempt count
    private final ConcurrentHashMap<String, Integer> loginAttemptCache = new ConcurrentHashMap<>();
    // key -> window start timestamp
    private final ConcurrentHashMap<String, Long> loginWindowCache = new ConcurrentHashMap<>();

    // In dev mode (mock.enabled=true) cooldown is 10 seconds; in prod it's 60 seconds
    @Value("${otp.mock.enabled:true}")
    private boolean mockEnabled;

    private static final int MAX_LOGIN_ATTEMPTS = 10;
    private static final long LOGIN_WINDOW_MINUTES = 15;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();
        String clientIp = getClientIp(request);

        // OTP send rate limit — use IP-based key (phone is in JSON body, not query param)
        if (path.contains("/send-otp")) {
            long cooldownMs = mockEnabled
                    ? TimeUnit.SECONDS.toMillis(10)   // 10s in dev
                    : TimeUnit.SECONDS.toMillis(60);  // 60s in prod

            String key = "otp_" + clientIp;
            Long lastTime = otpRequestCache.get(key);
            if (lastTime != null && System.currentTimeMillis() - lastTime < cooldownMs) {
                long remaining = (cooldownMs - (System.currentTimeMillis() - lastTime)) / 1000;
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Please wait " + remaining + " seconds before requesting another OTP\"}");
                return false;
            }
            otpRequestCache.put(key, System.currentTimeMillis());
            // Cleanup old entries
            otpRequestCache.entrySet().removeIf(e ->
                    System.currentTimeMillis() - e.getValue() > TimeUnit.HOURS.toMillis(1));
        }

        // OTP verify rate limit — track failed attempts per IP
        if (path.contains("/verify-otp")) {
            String key = "verify_" + clientIp;
            Long windowStart = loginWindowCache.get(key);
            long now = System.currentTimeMillis();
            long windowMs = TimeUnit.MINUTES.toMillis(LOGIN_WINDOW_MINUTES);

            // Reset window if expired
            if (windowStart == null || now - windowStart > windowMs) {
                loginWindowCache.put(key, now);
                loginAttemptCache.put(key, 0);
            }

            int attempts = loginAttemptCache.getOrDefault(key, 0);
            if (attempts >= MAX_LOGIN_ATTEMPTS) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Too many attempts. Please try again in 15 minutes.\"}");
                return false;
            }
            loginAttemptCache.put(key, attempts + 1);
        }

        return true;
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank() && !"unknown".equalsIgnoreCase(xff)) {
            return xff.split(",")[0].trim();
        }
        String xri = request.getHeader("X-Real-IP");
        if (xri != null && !xri.isBlank() && !"unknown".equalsIgnoreCase(xri)) {
            return xri;
        }
        return request.getRemoteAddr();
    }
}
