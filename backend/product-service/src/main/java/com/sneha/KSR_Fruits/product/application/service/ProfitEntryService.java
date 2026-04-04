package com.sneha.KSR_Fruits.product.application.service;

import com.sneha.KSR_Fruits.product.domain.model.ProfitEntry;
import com.sneha.KSR_Fruits.product.domain.repository.ProfitEntryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ProfitEntryService {

    private final ProfitEntryRepository repository;

    public ProfitEntryService(ProfitEntryRepository repository) {
        this.repository = repository;
    }

    public List<ProfitEntry> getAll() {
        return repository.findAll();
    }

    public List<ProfitEntry> getByDate(LocalDate date) {
        return repository.findByDate(date);
    }

    public List<ProfitEntry> getToday() {
        return repository.findByDate(LocalDate.now());
    }

    @Transactional
    public ProfitEntry save(ProfitEntry entry) {
        BigDecimal qty  = entry.getQuantity()  != null ? entry.getQuantity()  : BigDecimal.ZERO;
        BigDecimal buy  = entry.getBuyPrice()  != null ? entry.getBuyPrice()  : BigDecimal.ZERO;
        BigDecimal sell = entry.getSellPrice() != null ? entry.getSellPrice() : BigDecimal.ZERO;

        BigDecimal investment = buy.multiply(qty).setScale(2, RoundingMode.HALF_UP);
        BigDecimal revenue    = sell.multiply(qty).setScale(2, RoundingMode.HALF_UP);
        BigDecimal profit     = revenue.subtract(investment).setScale(2, RoundingMode.HALF_UP);
        BigDecimal margin     = investment.compareTo(BigDecimal.ZERO) > 0
                ? profit.divide(investment, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        entry.setInvestment(investment);
        entry.setRevenue(revenue);
        entry.setProfit(profit);
        entry.setMargin(margin);

        if (entry.getEntryDate() == null) entry.setEntryDate(LocalDate.now());

        LocalDateTime now = LocalDateTime.now();
        if (entry.getId() == null) {
            entry.setCreatedAt(now);
        }
        entry.setUpdatedAt(now);

        return repository.save(entry);
    }

    @Transactional
    public ProfitEntry update(Long id, ProfitEntry updated) {
        ProfitEntry existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Profit entry not found: " + id));
        updated.setId(existing.getId());
        updated.setCreatedAt(existing.getCreatedAt());
        return save(updated);
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

    /** Today's aggregated totals */
    public TodaySummary getTodaySummary() {
        List<ProfitEntry> today = getToday();
        BigDecimal totalInvest = today.stream().map(ProfitEntry::getInvestment).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRev    = today.stream().map(ProfitEntry::getRevenue).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalProfit = today.stream().map(ProfitEntry::getProfit).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal avgMargin   = totalInvest.compareTo(BigDecimal.ZERO) > 0
                ? totalProfit.divide(totalInvest, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        return new TodaySummary(today.size(), totalInvest, totalRev, totalProfit, avgMargin, LocalDate.now());
    }

    public record TodaySummary(
        int entryCount,
        BigDecimal totalInvestment,
        BigDecimal totalRevenue,
        BigDecimal totalProfit,
        BigDecimal avgMargin,
        LocalDate date
    ) {}
}
