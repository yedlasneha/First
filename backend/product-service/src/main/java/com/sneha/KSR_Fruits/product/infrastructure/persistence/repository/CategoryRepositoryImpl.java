package com.sneha.KSR_Fruits.product.infrastructure.persistence.repository;

import com.sneha.KSR_Fruits.product.domain.model.Category;
import com.sneha.KSR_Fruits.product.domain.repository.CategoryRepository;
import com.sneha.KSR_Fruits.product.infrastructure.persistence.entity.CategoryEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class CategoryRepositoryImpl implements CategoryRepository {

    private final JpaCategoryRepository jpa;

    public CategoryRepositoryImpl(JpaCategoryRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public Category save(Category category) {
        return toDomain(jpa.save(toEntity(category)));
    }

    @Override
    public Optional<Category> findById(Long id) {
        return jpa.findById(id).map(this::toDomain);
    }

    @Override
    public List<Category> findAll() {
        return jpa.findAll().stream().map(this::toDomain).collect(Collectors.toList());
    }

    private CategoryEntity toEntity(Category c) {
        CategoryEntity e = new CategoryEntity();
        e.setId(c.getId());
        e.setName(c.getName());
        e.setDescription(c.getDescription());
        e.setImageUrl(c.getImageUrl());
        return e;
    }

    private Category toDomain(CategoryEntity e) {
        Category c = new Category();
        c.setId(e.getId());
        c.setName(e.getName());
        c.setDescription(e.getDescription());
        c.setImageUrl(e.getImageUrl());
        return c;
    }
}
