package com.sneha.KSR_Fruits.product.infrastructure.persistence.repository;

import com.sneha.KSR_Fruits.product.infrastructure.persistence.entity.BenefitEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JpaBenefitRepository extends JpaRepository<BenefitEntity, Long> {
    List<BenefitEntity> findByProductId(Long productId);
}
