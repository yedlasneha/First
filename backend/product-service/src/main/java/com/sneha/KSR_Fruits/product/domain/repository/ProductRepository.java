package com.sneha.KSR_Fruits.product.domain.repository;

import com.sneha.KSR_Fruits.product.domain.model.Product;

import java.util.List;
import java.util.Optional;

public interface ProductRepository {
    Product save(Product product);
    Optional<Product> findById(Long id);
    List<Product> findAllActive();
    List<Product> findByCategoryId(Long categoryId);
    List<Product> findByCategory(String category);
    List<Product> searchByName(String name);
}
