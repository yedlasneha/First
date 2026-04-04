package com.sneha.KSR_Fruits.product.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ProfitEntry {
    private Long id;
    private String fruitName;
    private String unit;
    private BigDecimal quantity;
    private BigDecimal buyPrice;
    private BigDecimal sellPrice;
    private BigDecimal investment;
    private BigDecimal revenue;
    private BigDecimal profit;
    private BigDecimal margin;
    private LocalDate entryDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ProfitEntry() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFruitName() { return fruitName; }
    public void setFruitName(String fruitName) { this.fruitName = fruitName; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public BigDecimal getBuyPrice() { return buyPrice; }
    public void setBuyPrice(BigDecimal buyPrice) { this.buyPrice = buyPrice; }
    public BigDecimal getSellPrice() { return sellPrice; }
    public void setSellPrice(BigDecimal sellPrice) { this.sellPrice = sellPrice; }
    public BigDecimal getInvestment() { return investment; }
    public void setInvestment(BigDecimal investment) { this.investment = investment; }
    public BigDecimal getRevenue() { return revenue; }
    public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }
    public BigDecimal getProfit() { return profit; }
    public void setProfit(BigDecimal profit) { this.profit = profit; }
    public BigDecimal getMargin() { return margin; }
    public void setMargin(BigDecimal margin) { this.margin = margin; }
    public LocalDate getEntryDate() { return entryDate; }
    public void setEntryDate(LocalDate entryDate) { this.entryDate = entryDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
