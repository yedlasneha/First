package com.sneha.KSR_Fruits.product.application.service;

import com.sneha.KSR_Fruits.common.exception.ResourceNotFoundException;
import com.sneha.KSR_Fruits.product.domain.model.Product;
import com.sneha.KSR_Fruits.product.domain.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAllActive();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    public List<Product> getProductsByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }

    public List<Product> getProductsByType(String category) {
        return productRepository.findByCategory(category);
    }

    public List<Product> searchProducts(String query) {
        return productRepository.searchByName(query);
    }

    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product product) {
        Product existing = getProductById(id);
        existing.setName(product.getName());
        existing.setDescription(product.getDescription());
        existing.setPrice(product.getPrice());
        existing.setImageUrl(product.getImageUrl());
        existing.setCategoryId(product.getCategoryId());
        existing.setUnit(product.getUnit());
        existing.setDiscountPercentage(product.getDiscountPercentage());
        existing.setQuantity(product.getQuantity());
        if (product.getCategory() != null) existing.setCategory(product.getCategory());
        return productRepository.save(existing);
    }

    public Product updateStock(Long id, int quantity) {
        Product existing = getProductById(id);
        existing.setQuantity(quantity);
        return productRepository.save(existing);
    }

    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        product.setActive(false);
        productRepository.save(product);
    }
}
