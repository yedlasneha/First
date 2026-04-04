package com.sneha.KSR_Fruits.product.infrastructure.persistence.repository;

import com.sneha.KSR_Fruits.product.infrastructure.persistence.entity.ProfitEntryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface JpaProfitEntryRepository extends JpaRepository<ProfitEntryEntity, Long> {
    List<ProfitEntryEntity> findByEntryDateOrderByCreatedAtDesc(LocalDate entryDate);
    List<ProfitEntryEntity> findAllByOrderByEntryDateDescCreatedAtDesc();
}
