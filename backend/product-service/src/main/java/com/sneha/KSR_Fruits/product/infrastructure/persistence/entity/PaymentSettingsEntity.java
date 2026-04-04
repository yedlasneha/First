package com.sneha.KSR_Fruits.product.infrastructure.persistence.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "payment_settings")
public class PaymentSettingsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "upi_id")
    private String upiId;

    @Column(name = "upi_name")
    private String upiName;

    // Base64 or URL of QR code image
    @Column(name = "qr_image", columnDefinition = "LONGTEXT")
    private String qrImage;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "account_holder")
    private String accountHolder;

    @Column(name = "account_number")
    private String accountNumber;

    @Column(name = "ifsc_code")
    private String ifscCode;

    @Column(name = "branch")
    private String branch;

    @Column(name = "instructions", columnDefinition = "TEXT")
    private String instructions;

    public PaymentSettingsEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }
    public String getUpiName() { return upiName; }
    public void setUpiName(String upiName) { this.upiName = upiName; }
    public String getQrImage() { return qrImage; }
    public void setQrImage(String qrImage) { this.qrImage = qrImage; }
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    public String getAccountHolder() { return accountHolder; }
    public void setAccountHolder(String accountHolder) { this.accountHolder = accountHolder; }
    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }
    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }
    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
}
