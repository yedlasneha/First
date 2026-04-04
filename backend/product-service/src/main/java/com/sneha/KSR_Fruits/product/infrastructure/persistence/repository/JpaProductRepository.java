package com.sneha.KSR_Fruits.product.infrastructure.persistence.repository;

import com.sneha.KSR_Fruits.product.infrastructure.persistence.entity.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JpaProductRepository extends JpaRepository<ProductEntity, Long> {
    List<ProductEntity> findByCategoryId(Long categoryId);
    List<ProductEntity> findByActiveTrue();
    List<ProductEntity> findByNameContainingIgnoreCase(String name);
    List<ProductEntity> findByCategoryAndActiveTrue(String category);
}
