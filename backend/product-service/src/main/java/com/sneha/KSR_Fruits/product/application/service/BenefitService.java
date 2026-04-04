package com.sneha.KSR_Fruits.product.application.service;

import com.sneha.KSR_Fruits.product.domain.model.Benefit;
import com.sneha.KSR_Fruits.product.infrastructure.persistence.entity.BenefitEntity;
import com.sneha.KSR_Fruits.product.infrastructure.persistence.repository.JpaBenefitRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BenefitService {

    private final JpaBenefitRepository repo;

    public BenefitService(JpaBenefitRepository repo) {
        this.repo = repo;
    }

    public List<Benefit> getAll() {
        return repo.findAll().stream().map(this::toDomain).collect(Collectors.toList());
    }

    public List<Benefit> getByProduct(Long productId) {
        return repo.findByProductId(productId).stream().map(this::toDomain).collect(Collectors.toList());
    }

    public Benefit create(Benefit b) {
        return toDomain(repo.save(toEntity(b)));
    }

    public Benefit update(Long id, Benefit b) {
        BenefitEntity e = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Benefit not found: " + id));
        e.setProductId(b.getProductId());
        e.setProductName(b.getProductName());
        e.setTitle(b.getTitle());
        e.setDescription(b.getDescription());
        return toDomain(repo.save(e));
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }

    private BenefitEntity toEntity(Benefit b) {
        BenefitEntity e = new BenefitEntity();
        e.setId(b.getId());
        e.setProductId(b.getProductId());
        e.setProductName(b.getProductName());
        e.setTitle(b.getTitle());
        e.setDescription(b.getDescription());
        return e;
    }

    private Benefit toDomain(BenefitEntity e) {
        Benefit b = new Benefit();
        b.setId(e.getId());
        b.setProductId(e.getProductId());
        b.setProductName(e.getProductName());
        b.setTitle(e.getTitle());
        b.setDescription(e.getDescription());
        return b;
    }
}
