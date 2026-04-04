package com.sneha.KSR_Fruits.product.infrastructure.persistence.repository;

import com.sneha.KSR_Fruits.product.domain.model.Product;
import com.sneha.KSR_Fruits.product.domain.repository.ProductRepository;
import com.sneha.KSR_Fruits.product.infrastructure.persistence.entity.ProductEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class ProductRepositoryImpl implements ProductRepository {

    private final JpaProductRepository jpa;

    public ProductRepositoryImpl(JpaProductRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public Product save(Product product) {
        return toDomain(jpa.save(toEntity(product)));
    }

    @Override
    public Optional<Product> findById(Long id) {
        return jpa.findById(id).map(this::toDomain);
    }

    @Override
    public List<Product> findAllActive() {
        return jpa.findByActiveTrue().stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public List<Product> findByCategoryId(Long categoryId) {
        return jpa.findByCategoryId(categoryId).stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public List<Product> findByCategory(String category) {
        return jpa.findByCategoryAndActiveTrue(category).stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public List<Product> searchByName(String name) {
        return jpa.findByNameContainingIgnoreCase(name).stream().map(this::toDomain).collect(Collectors.toList());
    }

    private ProductEntity toEntity(Product p) {
        ProductEntity e = new ProductEntity();
        e.setId(p.getId());
        e.setName(p.getName());
        e.setDescription(p.getDescription());
        e.setPrice(p.getPrice());
        e.setImageUrl(p.getImageUrl());
        e.setCategoryId(p.getCategoryId());
        e.setUnit(p.getUnit());
        e.setDiscountPercentage(p.getDiscountPercentage());
        e.setQuantity(p.getQuantity());
        e.setActive(p.getActive());
        e.setCategory(p.getCategory() != null ? p.getCategory() : "fruit");
        return e;
    }

    private Product toDomain(ProductEntity e) {
        Product p = new Product();
        p.setId(e.getId());
        p.setName(e.getName());
        p.setDescription(e.getDescription());
        p.setPrice(e.getPrice());
        p.setImageUrl(e.getImageUrl());
        p.setCategoryId(e.getCategoryId());
        p.setUnit(e.getUnit());
        p.setDiscountPercentage(e.getDiscountPercentage());
        p.setQuantity(e.getQuantity());
        p.setActive(e.getActive());
        p.setCategory(e.getCategory() != null ? e.getCategory() : "fruit");
        return p;
    }
}
