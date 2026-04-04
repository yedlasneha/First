package com.sneha.KSR_Fruits.product.application.service;

import com.sneha.KSR_Fruits.product.domain.model.AboutUs;
import com.sneha.KSR_Fruits.product.infrastructure.persistence.entity.AboutUsEntity;
import com.sneha.KSR_Fruits.product.infrastructure.persistence.repository.JpaAboutUsRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AboutUsService {

    private final JpaAboutUsRepository repo;

    public AboutUsService(JpaAboutUsRepository repo) {
        this.repo = repo;
    }

    public List<AboutUs> getAll() {
        return repo.findAll().stream().map(this::toDomain).collect(Collectors.toList());
    }

    public AboutUs create(AboutUs about) {
        return toDomain(repo.save(toEntity(about)));
    }

    public AboutUs update(Long id, AboutUs about) {
        AboutUsEntity e = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("About Us not found: " + id));
        e.setTitle(about.getTitle());
        e.setDescription(about.getDescription());
        return toDomain(repo.save(e));
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }

    private AboutUsEntity toEntity(AboutUs a) {
        AboutUsEntity e = new AboutUsEntity();
        e.setId(a.getId());
        e.setTitle(a.getTitle());
        e.setDescription(a.getDescription());
        return e;
    }

    private AboutUs toDomain(AboutUsEntity e) {
        AboutUs a = new AboutUs();
        a.setId(e.getId());
        a.setTitle(e.getTitle());
        a.setDescription(e.getDescription());
        return a;
    }
}
