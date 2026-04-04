package com.sneha.KSR_Fruits.product.application.service;

import com.sneha.KSR_Fruits.product.domain.model.Banner;
import com.sneha.KSR_Fruits.product.infrastructure.persistence.entity.BannerEntity;
import com.sneha.KSR_Fruits.product.infrastructure.persistence.repository.JpaBannerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BannerService {

    private static final Logger log = LoggerFactory.getLogger(BannerService.class);

    private final JpaBannerRepository repo;

    public BannerService(JpaBannerRepository repo) {
        this.repo = repo;
    }

    /** Active banners ordered by displayOrder — user UI */
    public List<Banner> getActive() {
        return repo.findByActiveTrueOrderByDisplayOrderAsc()
                .stream().map(this::toDomain).collect(Collectors.toList());
    }

    /** All banners — admin */
    public List<Banner> getAll() {
        return repo.findAllByOrderByDisplayOrderAsc()
                .stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Transactional
    public Banner create(Banner b) {
        BannerEntity e = new BannerEntity();
        e.setImageUrl(b.getImageUrl() != null ? b.getImageUrl() : "");
        e.setTitle(b.getTitle() != null && !b.getTitle().isBlank() ? b.getTitle() : "New Banner");
        e.setSubtitle(b.getSubtitle());
        e.setTag(b.getTag());
        e.setBadges(badgesToString(b.getBadges()));
        e.setDisplayOrder(b.getDisplayOrder() != null ? b.getDisplayOrder() : (int) repo.count());
        e.setActive(true); // always active on create
        log.info("Creating banner: title={}, imageUrl={}", e.getTitle(), e.getImageUrl());
        return toDomain(repo.save(e));
    }

    @Transactional
    public Banner update(Long id, Banner b) {
        BannerEntity e = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner not found: " + id));
        e.setImageUrl(b.getImageUrl() != null ? b.getImageUrl() : e.getImageUrl());
        e.setTitle(b.getTitle() != null && !b.getTitle().isBlank() ? b.getTitle() : e.getTitle());
        e.setSubtitle(b.getSubtitle());
        e.setTag(b.getTag());
        e.setBadges(badgesToString(b.getBadges()));
        if (b.getDisplayOrder() != null) e.setDisplayOrder(b.getDisplayOrder());
        e.setActive(b.isActive());
        return toDomain(repo.save(e));
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
    }

    private Banner toDomain(BannerEntity e) {
        Banner b = new Banner();
        b.setId(e.getId());
        b.setImageUrl(e.getImageUrl());
        b.setTitle(e.getTitle());
        b.setSubtitle(e.getSubtitle());
        b.setTag(e.getTag());
        b.setBadges(stringToBadges(e.getBadges()));
        b.setDisplayOrder(e.getDisplayOrder());
        b.setActive(e.isActive());
        return b;
    }

    private String badgesToString(List<String> badges) {
        if (badges == null || badges.isEmpty()) return "";
        return badges.stream()
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.joining(","));
    }

    private List<String> stringToBadges(String s) {
        if (s == null || s.isBlank()) return Collections.emptyList();
        return Arrays.stream(s.split(","))
                .map(String::trim)
                .filter(x -> !x.isEmpty())
                .collect(Collectors.toList());
    }
}
