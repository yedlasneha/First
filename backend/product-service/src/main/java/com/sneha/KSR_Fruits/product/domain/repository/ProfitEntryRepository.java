package com.sneha.KSR_Fruits.product.domain.repository;

import com.sneha.KSR_Fruits.product.domain.model.ProfitEntry;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ProfitEntryRepository {
    ProfitEntry save(ProfitEntry entry);
    Optional<ProfitEntry> findById(Long id);
    List<ProfitEntry> findAll();
    List<ProfitEntry> findByDate(LocalDate date);
    void deleteById(Long id);
}
