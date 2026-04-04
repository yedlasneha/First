package com.sneha.KSR_Fruits.product.domain.model;

import java.util.List;

public class Banner {
    private Long id;
    private String imageUrl;
    private String title;
    private String subtitle;
    private String tag;
    private List<String> badges;
    private Integer displayOrder;
    private boolean active = true;

    public Banner() {}

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
    public List<String> getBadges() { return badges; }
    public void setBadges(List<String> badges) { this.badges = badges; }
    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
