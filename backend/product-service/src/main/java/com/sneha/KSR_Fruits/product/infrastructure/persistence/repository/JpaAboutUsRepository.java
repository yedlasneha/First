package com.sneha.KSR_Fruits.product.infrastructure.persistence.repository;

import com.sneha.KSR_Fruits.product.infrastructure.persistence.entity.AboutUsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JpaAboutUsRepository extends JpaRepository<AboutUsEntity, Long> {
}
