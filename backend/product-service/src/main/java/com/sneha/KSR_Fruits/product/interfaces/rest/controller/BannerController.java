package com.sneha.KSR_Fruits.product.interfaces.rest.controller;

import com.sneha.KSR_Fruits.product.application.service.BannerService;
import com.sneha.KSR_Fruits.product.domain.model.Banner;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/banners")
@CrossOrigin(origins = "*")
public class BannerController {

    private static final Logger log = LoggerFactory.getLogger(BannerController.class);

    private final BannerService bannerService;

    public BannerController(BannerService bannerService) {
        this.bannerService = bannerService;
    }

    /** GET /api/banners — active banners for user UI */
    @GetMapping
    public ResponseEntity<List<Banner>> getActive() {
        return ResponseEntity.ok(bannerService.getActive());
    }

    /** GET /api/banners/all — all banners for admin */
    @GetMapping("/all")
    public ResponseEntity<List<Banner>> getAll() {
        return ResponseEntity.ok(bannerService.getAll());
    }

    /** POST /api/banners */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Banner banner) {
        try {
            log.info("POST /api/banners — title={}", banner.getTitle());
            Banner created = bannerService.create(banner);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            log.error("Failed to create banner: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /** PUT /api/banners/{id} */
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Banner banner) {
        try {
            return ResponseEntity.ok(bannerService.update(id, banner));
        } catch (Exception e) {
            log.error("Failed to update banner {}: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /** DELETE /api/banners/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        bannerService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
