package com.sneha.KSR_Fruits.cart.application.service;

import com.sneha.KSR_Fruits.cart.domain.model.CartItem;
import com.sneha.KSR_Fruits.cart.infrastructure.persistence.JpaCartItemRepository;
import com.sneha.KSR_Fruits.common.exception.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class CartService {

    private final JpaCartItemRepository repo;

    public CartService(JpaCartItemRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public CartItem addToCart(Long userId, Long productId, Integer quantity, BigDecimal price, String productName) {
        return repo.findByUserIdAndProductId(userId, productId)
            .map(existing -> {
                existing.setQuantity(existing.getQuantity() + quantity);
                return repo.save(existing);
            })
            .orElseGet(() -> repo.save(new CartItem(userId, productId, productName, quantity, price)));
    }

    public List<CartItem> getCart(Long userId) {
        return repo.findByUserId(userId);
    }

    @Transactional
    public void updateQuantity(Long userId, Long productId, Integer quantity) {
        if (quantity <= 0) throw new BusinessException("Quantity must be greater than 0");
        CartItem item = repo.findByUserIdAndProductId(userId, productId)
            .orElseThrow(() -> new BusinessException("Item not found in cart"));
        item.setQuantity(quantity);
        repo.save(item);
    }

    @Transactional
    public void removeFromCart(Long userId, Long productId) {
        repo.deleteByUserIdAndProductId(userId, productId);
    }

    @Transactional
    public void clearCart(Long userId) {
        repo.deleteByUserId(userId);
    }

    public BigDecimal getCartTotal(Long userId) {
        return repo.findByUserId(userId).stream()
            .map(i -> i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
