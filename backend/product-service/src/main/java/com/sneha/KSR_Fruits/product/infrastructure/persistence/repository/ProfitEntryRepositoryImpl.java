package com.sneha.KSR_Fruits.product.infrastructure.persistence.repository;

import com.sneha.KSR_Fruits.product.domain.model.ProfitEntry;
import com.sneha.KSR_Fruits.product.domain.repository.ProfitEntryRepository;
import com.sneha.KSR_Fruits.product.infrastructure.persistence.entity.ProfitEntryEntity;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public class ProfitEntryRepositoryImpl implements ProfitEntryRepository {

    private final JpaProfitEntryRepository jpa;

    public ProfitEntryRepositoryImpl(JpaProfitEntryRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public ProfitEntry save(ProfitEntry entry) {
        return toDomain(jpa.save(toEntity(entry)));
    }

    @Override
    public Optional<ProfitEntry> findById(Long id) {
        return jpa.findById(id).map(this::toDomain);
    }

    @Override
    public List<ProfitEntry> findAll() {
        return jpa.findAllByOrderByEntryDateDescCreatedAtDesc().stream().map(this::toDomain).toList();
    }

    @Override
    public List<ProfitEntry> findByDate(LocalDate date) {
        return jpa.findByEntryDateOrderByCreatedAtDesc(date).stream().map(this::toDomain).toList();
    }

    @Override
    public void deleteById(Long id) {
        jpa.deleteById(id);
    }

    private ProfitEntryEntity toEntity(ProfitEntry e) {
        ProfitEntryEntity en = new ProfitEntryEntity();
        en.setId(e.getId());
        en.setFruitName(e.getFruitName());
        en.setUnit(e.getUnit());
        en.setQuantity(e.getQuantity());
        en.setBuyPrice(e.getBuyPrice());
        en.setSellPrice(e.getSellPrice());
        en.setInvestment(e.getInvestment());
        en.setRevenue(e.getRevenue());
        en.setProfit(e.getProfit());
        en.setMargin(e.getMargin());
        en.setEntryDate(e.getEntryDate() != null ? e.getEntryDate() : LocalDate.now());
        if (e.getCreatedAt() != null) en.setCreatedAt(e.getCreatedAt());
        if (e.getUpdatedAt() != null) en.setUpdatedAt(e.getUpdatedAt());
        return en;
    }

    private ProfitEntry toDomain(ProfitEntryEntity en) {
        ProfitEntry e = new ProfitEntry();
        e.setId(en.getId());
        e.setFruitName(en.getFruitName());
        e.setUnit(en.getUnit());
        e.setQuantity(en.getQuantity());
        e.setBuyPrice(en.getBuyPrice());
        e.setSellPrice(en.getSellPrice());
        e.setInvestment(en.getInvestment());
        e.setRevenue(en.getRevenue());
        e.setProfit(en.getProfit());
        e.setMargin(en.getMargin());
        e.setEntryDate(en.getEntryDate());
        e.setCreatedAt(en.getCreatedAt());
        e.setUpdatedAt(en.getUpdatedAt());
        return e;
    }
}
