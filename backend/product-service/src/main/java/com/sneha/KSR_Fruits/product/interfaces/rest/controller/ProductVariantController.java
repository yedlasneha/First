package com.sneha.KSR_Fruits.product.interfaces.rest.controller;

import com.sneha.KSR_Fruits.product.application.service.ProductVariantService;
import com.sneha.KSR_Fruits.product.domain.model.ProductVariant;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products/{productId}/variants")
@CrossOrigin(origins = "*")
public class ProductVariantController {

    private final ProductVariantService variantService;

    public ProductVariantController(ProductVariantService variantService) {
        this.variantService = variantService;
    }

    @GetMapping
    public ResponseEntity<List<ProductVariant>> getByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(variantService.getByProduct(productId));
    }

    @PostMapping
    public ResponseEntity<ProductVariant> create(@PathVariable Long productId,
                                                  @RequestBody ProductVariant variant) {
        variant.setProductId(productId);
        return ResponseEntity.ok(variantService.create(variant));
    }

    @PutMapping("/replace")
    public ResponseEntity<List<ProductVariant>> replaceAll(@PathVariable Long productId,
                                                            @RequestBody List<ProductVariant> variants) {
        return ResponseEntity.ok(variantService.replaceAll(productId, variants));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductVariant> update(@PathVariable Long productId,
                                                  @PathVariable Long id,
                                                  @RequestBody ProductVariant variant) {
        return ResponseEntity.ok(variantService.update(id, variant));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long productId, @PathVariable Long id) {
        variantService.delete(id);
        return ResponseEntity.ok().build();
    }
}
