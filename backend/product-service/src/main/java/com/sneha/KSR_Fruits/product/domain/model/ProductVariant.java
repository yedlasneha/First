package com.sneha.KSR_Fruits.product.domain.model;

import java.math.BigDecimal;

public class ProductVariant {
    private Long id;
    private Long productId;
    private String size;
    private BigDecimal price;
    private Integer discountPercentage = 0;
    private Integer quantity = 0;

    public ProductVariant() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public Integer getDiscountPercentage() { return discountPercentage; }
    public void setDiscountPercentage(Integer d) { this.discountPercentage = d; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
