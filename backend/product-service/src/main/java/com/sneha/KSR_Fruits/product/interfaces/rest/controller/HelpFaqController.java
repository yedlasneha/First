package com.sneha.KSR_Fruits.product.interfaces.rest.controller;

import com.sneha.KSR_Fruits.product.application.service.HelpFaqService;
import com.sneha.KSR_Fruits.product.domain.model.HelpFaq;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/help")
@CrossOrigin(origins = "*")
public class HelpFaqController {

    private final HelpFaqService helpFaqService;

    public HelpFaqController(HelpFaqService helpFaqService) {
        this.helpFaqService = helpFaqService;
    }

    @GetMapping
    public ResponseEntity<List<HelpFaq>> getAll() {
        return ResponseEntity.ok(helpFaqService.getAll());
    }

    @PostMapping
    public ResponseEntity<HelpFaq> create(@RequestBody HelpFaq faq) {
        return ResponseEntity.ok(helpFaqService.create(faq));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HelpFaq> update(@PathVariable Long id, @RequestBody HelpFaq faq) {
        return ResponseEntity.ok(helpFaqService.update(id, faq));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        helpFaqService.delete(id);
        return ResponseEntity.ok().build();
    }
}
