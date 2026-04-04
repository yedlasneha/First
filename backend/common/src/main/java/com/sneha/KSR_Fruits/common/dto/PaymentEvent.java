package com.sneha.KSR_Fruits.common.dto;

import java.math.BigDecimal;

public class PaymentEvent {
    private Long orderId;
    private String paymentId;
    private BigDecimal amount;
    private String status;
    private String eventType;

    public PaymentEvent() {}

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
}
