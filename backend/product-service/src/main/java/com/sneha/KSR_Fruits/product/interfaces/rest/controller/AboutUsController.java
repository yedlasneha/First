package com.sneha.KSR_Fruits.product.interfaces.rest.controller;

import com.sneha.KSR_Fruits.product.application.service.AboutUsService;
import com.sneha.KSR_Fruits.product.domain.model.AboutUs;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/about")
@CrossOrigin(origins = "*")
public class AboutUsController {

    private final AboutUsService aboutUsService;

    public AboutUsController(AboutUsService aboutUsService) {
        this.aboutUsService = aboutUsService;
    }

    @GetMapping
    public ResponseEntity<List<AboutUs>> getAll() {
        return ResponseEntity.ok(aboutUsService.getAll());
    }

    @PostMapping
    public ResponseEntity<AboutUs> create(@RequestBody AboutUs about) {
        return ResponseEntity.ok(aboutUsService.create(about));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AboutUs> update(@PathVariable Long id, @RequestBody AboutUs about) {
        return ResponseEntity.ok(aboutUsService.update(id, about));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        aboutUsService.delete(id);
        return ResponseEntity.ok().build();
    }
}
