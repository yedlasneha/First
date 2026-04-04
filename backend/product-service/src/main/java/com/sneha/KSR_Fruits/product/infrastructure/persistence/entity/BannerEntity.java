package com.sneha.KSR_Fruits.product.infrastructure.persistence.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "banners")
public class BannerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "LONGTEXT")
    private String subtitle;

    @Column(columnDefinition = "TEXT")
    private String tag;

    @Column(columnDefinition = "TEXT")
    private String badges; // stored as comma-separated string

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(nullable = false)
    private boolean active = true;

    public BannerEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSubtitle() { return subtitle; }
    public void setSubtitle(String subtitle) { this.subtitle = subtitle; }
    public String getTag() { return tag; }
    public void setTag(String tag) { this.tag = tag; }
    public String getBadges() { return badges; }
    public void setBadges(String badges) { this.badges = badges; }
    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
