package com.sneha.KSR_Fruits.product.infrastructure.persistence.repository;

import com.sneha.KSR_Fruits.product.infrastructure.persistence.entity.ProductVariantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JpaProductVariantRepository extends JpaRepository<ProductVariantEntity, Long> {
    List<ProductVariantEntity> findByProductId(Long productId);
    void deleteByProductId(Long productId);
}
