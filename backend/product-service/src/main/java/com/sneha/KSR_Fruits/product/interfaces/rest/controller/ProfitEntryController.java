package com.sneha.KSR_Fruits.product.interfaces.rest.controller;

import com.sneha.KSR_Fruits.product.application.service.ProfitEntryService;
import com.sneha.KSR_Fruits.product.domain.model.ProfitEntry;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/profit")
@CrossOrigin(origins = "*")
public class ProfitEntryController {

    private final ProfitEntryService service;

    public ProfitEntryController(ProfitEntryService service) {
        this.service = service;
    }

    /** GET /api/profit — all entries */
    @GetMapping
    public ResponseEntity<List<ProfitEntry>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    /** GET /api/profit/today — today's entries */
    @GetMapping("/today")
    public ResponseEntity<List<ProfitEntry>> getToday() {
        return ResponseEntity.ok(service.getToday());
    }

    /** GET /api/profit/today/summary — today's aggregated totals */
    @GetMapping("/today/summary")
    public ResponseEntity<ProfitEntryService.TodaySummary> getTodaySummary() {
        return ResponseEntity.ok(service.getTodaySummary());
    }

    /** GET /api/profit/by-date?date=2025-03-31 */
    @GetMapping("/by-date")
    public ResponseEntity<List<ProfitEntry>> getByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(service.getByDate(date));
    }

    /** POST /api/profit — save a new entry (investment/revenue/profit auto-calculated) */
    @PostMapping
    public ResponseEntity<ProfitEntry> create(@RequestBody ProfitEntry entry) {
        return ResponseEntity.ok(service.save(entry));
    }

    /** PUT /api/profit/{id} — update an entry */
    @PutMapping("/{id}")
    public ResponseEntity<ProfitEntry> update(@PathVariable Long id, @RequestBody ProfitEntry entry) {
        return ResponseEntity.ok(service.update(id, entry));
    }

    /** DELETE /api/profit/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
