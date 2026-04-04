package com.sneha.KSR_Fruits.product.interfaces.rest.controller;

import com.sneha.KSR_Fruits.product.application.service.BenefitService;
import com.sneha.KSR_Fruits.product.domain.model.Benefit;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/benefits")
@CrossOrigin(origins = "*")
public class BenefitController {

    private final BenefitService benefitService;

    public BenefitController(BenefitService benefitService) {
        this.benefitService = benefitService;
    }

    @GetMapping
    public ResponseEntity<List<Benefit>> getAll() {
        return ResponseEntity.ok(benefitService.getAll());
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Benefit>> getByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(benefitService.getByProduct(productId));
    }

    @PostMapping
    public ResponseEntity<Benefit> create(@RequestBody Benefit benefit) {
        return ResponseEntity.ok(benefitService.create(benefit));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Benefit> update(@PathVariable Long id, @RequestBody Benefit benefit) {
        return ResponseEntity.ok(benefitService.update(id, benefit));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        benefitService.delete(id);
        return ResponseEntity.ok().build();
    }
}
