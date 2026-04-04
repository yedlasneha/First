package com.sneha.KSR_Fruits.product.domain.repository;

import com.sneha.KSR_Fruits.product.domain.model.Category;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository {
    Category save(Category category);
    Optional<Category> findById(Long id);
    List<Category> findAll();
}
