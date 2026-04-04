package com.sneha.KSR_Fruits.product.application.service;

import com.sneha.KSR_Fruits.product.domain.model.HelpFaq;
import com.sneha.KSR_Fruits.product.infrastructure.persistence.entity.HelpFaqEntity;
import com.sneha.KSR_Fruits.product.infrastructure.persistence.repository.JpaHelpFaqRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class HelpFaqService {

    private final JpaHelpFaqRepository repo;

    public HelpFaqService(JpaHelpFaqRepository repo) {
        this.repo = repo;
    }

    public List<HelpFaq> getAll() {
        return repo.findAll().stream().map(this::toDomain).collect(Collectors.toList());
    }

    public HelpFaq create(HelpFaq faq) {
        return toDomain(repo.save(toEntity(faq)));
    }

    public HelpFaq update(Long id, HelpFaq faq) {
        HelpFaqEntity e = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("FAQ not found: " + id));
        e.setTitle(faq.getTitle());
        e.setDescription(faq.getDescription());
        e.setContactEmail(faq.getContactEmail());
        e.setContactPhone(faq.getContactPhone());
        e.setAdditionalNotes(faq.getAdditionalNotes());
        return toDomain(repo.save(e));
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }

    private HelpFaqEntity toEntity(HelpFaq f) {
        HelpFaqEntity e = new HelpFaqEntity();
        e.setId(f.getId());
        e.setTitle(f.getTitle());
        e.setDescription(f.getDescription());
        e.setContactEmail(f.getContactEmail());
        e.setContactPhone(f.getContactPhone());
        e.setAdditionalNotes(f.getAdditionalNotes());
        return e;
    }

    private HelpFaq toDomain(HelpFaqEntity e) {
        HelpFaq f = new HelpFaq();
        f.setId(e.getId());
        f.setTitle(e.getTitle());
        f.setDescription(e.getDescription());
        f.setContactEmail(e.getContactEmail());
        f.setContactPhone(e.getContactPhone());
        f.setAdditionalNotes(e.getAdditionalNotes());
        return f;
    }
}
