package com.sneha.KSR_Fruits.product.infrastructure.persistence.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "product_variants")
public class ProductVariantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(nullable = false)
    private String size;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "discount_percentage")
    private Integer discountPercentage = 0;

    private Integer quantity = 0;

    public ProductVariantEntity() {}

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
