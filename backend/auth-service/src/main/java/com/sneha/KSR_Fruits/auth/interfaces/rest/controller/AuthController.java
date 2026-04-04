package com.sneha.KSR_Fruits.auth.interfaces.rest.controller;

import com.sneha.KSR_Fruits.auth.application.service.AuthService;
import com.sneha.KSR_Fruits.auth.interfaces.dto.ProfileRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // ── User Email OTP ────────────────────────────────────────────────────

    /** POST /api/auth/send-otp  { "email": "user@example.com" } */
    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, Object>> sendOtp(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(authService.sendOtp(body.get("email")));
    }

    /** POST /api/auth/verify-otp  { "email": "...", "otp": "123456" } */
    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(authService.verifyOtp(body.get("email"), body.get("otp")));
    }

    // ── Admin Email OTP ───────────────────────────────────────────────────

    /** POST /api/auth/admin/send-otp  { "email": "ksrfruitshelp@gmail.com" } */
    @PostMapping("/admin/send-otp")
    public ResponseEntity<Map<String, Object>> sendAdminOtp(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(authService.sendAdminOtp(body.get("email")));
    }

    /** POST /api/auth/admin/verify-otp  { "email": "...", "otp": "..." } */
    @PostMapping("/admin/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyAdminOtp(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(authService.verifyAdminOtp(body.get("email"), body.get("otp")));
    }

    // ── Profile ───────────────────────────────────────────────────────────

    @GetMapping("/profile/{userId}")
    public ResponseEntity<Map<String, Object>> getProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(authService.getProfile(userId));
    }

    @PutMapping("/profile/{userId}")
    public ResponseEntity<Map<String, Object>> saveProfile(
            @PathVariable Long userId,
            @RequestBody ProfileRequest req) {
        return ResponseEntity.ok(authService.saveProfile(
                userId, req.getName(), req.getEmail(), req.getAddress(),
                req.getReceiverName(), req.getReceiverMobile()));
    }

    // ── Token Validation ──────────────────────────────────────────────────

    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateToken(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(authService.validateToken(body.get("token")));
    }

    // ── Admin: Users List ─────────────────────────────────────────────────

    @GetMapping("/admin/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }
}
