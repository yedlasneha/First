package com.sneha.KSR_Fruits.product.application.service;

import com.sneha.KSR_Fruits.product.domain.model.ProductVariant;
import com.sneha.KSR_Fruits.product.infrastructure.persistence.entity.ProductVariantEntity;
import com.sneha.KSR_Fruits.product.infrastructure.persistence.repository.JpaProductVariantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductVariantService {

    private final JpaProductVariantRepository repo;

    public ProductVariantService(JpaProductVariantRepository repo) {
        this.repo = repo;
    }

    public List<ProductVariant> getByProduct(Long productId) {
        return repo.findByProductId(productId).stream().map(this::toDomain).collect(Collectors.toList());
    }

    public ProductVariant create(ProductVariant v) {
        return toDomain(repo.save(toEntity(v)));
    }

    public ProductVariant update(Long id, ProductVariant v) {
        ProductVariantEntity e = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Variant not found: " + id));
        e.setSize(v.getSize());
        e.setPrice(v.getPrice());
        e.setDiscountPercentage(v.getDiscountPercentage());
        e.setQuantity(v.getQuantity());
        return toDomain(repo.save(e));
    }

    @Transactional
    public List<ProductVariant> replaceAll(Long productId, List<ProductVariant> variants) {
        repo.deleteByProductId(productId);
        return variants.stream().map(v -> {
            v.setProductId(productId);
            return toDomain(repo.save(toEntity(v)));
        }).collect(Collectors.toList());
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }

    private ProductVariantEntity toEntity(ProductVariant v) {
        ProductVariantEntity e = new ProductVariantEntity();
        e.setId(v.getId());
        e.setProductId(v.getProductId());
        e.setSize(v.getSize());
        e.setPrice(v.getPrice());
        e.setDiscountPercentage(v.getDiscountPercentage() != null ? v.getDiscountPercentage() : 0);
        e.setQuantity(v.getQuantity() != null ? v.getQuantity() : 0);
        return e;
    }

    private ProductVariant toDomain(ProductVariantEntity e) {
        ProductVariant v = new ProductVariant();
        v.setId(e.getId());
        v.setProductId(e.getProductId());
        v.setSize(e.getSize());
        v.setPrice(e.getPrice());
        v.setDiscountPercentage(e.getDiscountPercentage());
        v.setQuantity(e.getQuantity());
        return v;
    }
}
