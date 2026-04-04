package com.sneha.KSR_Fruits.product.interfaces.rest.controller;

import com.sneha.KSR_Fruits.product.application.service.PaymentSettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/payment-settings")
@CrossOrigin(origins = "*")
public class PaymentSettingsController {

    private final PaymentSettingsService service;

    public PaymentSettingsController(PaymentSettingsService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> get() {
        return ResponseEntity.ok(service.get());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> save(@RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(service.save(data));
    }
}
