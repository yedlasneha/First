package com.sneha.KSR_Fruits.product.application.service;

import com.sneha.KSR_Fruits.product.infrastructure.persistence.entity.PaymentSettingsEntity;
import com.sneha.KSR_Fruits.product.infrastructure.persistence.repository.JpaPaymentSettingsRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class PaymentSettingsService {

    private final JpaPaymentSettingsRepository repo;

    public PaymentSettingsService(JpaPaymentSettingsRepository repo) {
        this.repo = repo;
    }

    /** Returns the single payment settings record (id=1), or empty map if not set */
    public Map<String, Object> get() {
        return repo.findById(1L).map(this::toMap).orElse(new HashMap<>());
    }

    /** Upsert — always saves as id=1 */
    public Map<String, Object> save(Map<String, Object> data) {
        PaymentSettingsEntity e = repo.findById(1L).orElse(new PaymentSettingsEntity());
        e.setId(1L);
        e.setUpiId(str(data, "upiId"));
        e.setUpiName(str(data, "upiName"));
        e.setQrImage(str(data, "qrImage"));
        e.setBankName(str(data, "bankName"));
        e.setAccountHolder(str(data, "accountHolder"));
        e.setAccountNumber(str(data, "accountNumber"));
        e.setIfscCode(str(data, "ifscCode"));
        e.setBranch(str(data, "branch"));
        e.setInstructions(str(data, "instructions"));
        return toMap(repo.save(e));
    }

    private String str(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v != null ? v.toString() : null;
    }

    private Map<String, Object> toMap(PaymentSettingsEntity e) {
        Map<String, Object> m = new HashMap<>();
        m.put("upiId",         e.getUpiId());
        m.put("upiName",       e.getUpiName());
        m.put("qrImage",       e.getQrImage());
        m.put("bankName",      e.getBankName());
        m.put("accountHolder", e.getAccountHolder());
        m.put("accountNumber", e.getAccountNumber());
        m.put("ifscCode",      e.getIfscCode());
        m.put("branch",        e.getBranch());
        m.put("instructions",  e.getInstructions());
        return m;
    }
}
