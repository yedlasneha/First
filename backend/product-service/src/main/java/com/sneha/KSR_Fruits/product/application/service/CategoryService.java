package com.sneha.KSR_Fruits.product.application.service;

import com.sneha.KSR_Fruits.common.exception.ResourceNotFoundException;
import com.sneha.KSR_Fruits.product.domain.model.Category;
import com.sneha.KSR_Fruits.product.domain.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
    }

    public Category createCategory(Category category) {
        return categoryRepository.save(category);
    }
}
