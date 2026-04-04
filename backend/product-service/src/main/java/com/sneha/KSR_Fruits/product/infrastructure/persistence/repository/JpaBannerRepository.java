package com.sneha.KSR_Fruits.product.infrastructure.persistence.repository;

import com.sneha.KSR_Fruits.product.infrastructure.persistence.entity.BannerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JpaBannerRepository extends JpaRepository<BannerEntity, Long> {
    List<BannerEntity> findByActiveTrueOrderByDisplayOrderAsc();
    List<BannerEntity> findAllByOrderByDisplayOrderAsc();
}
