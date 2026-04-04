package com.sneha.KSR_Fruits.cart.infrastructure.persistence;

import com.sneha.KSR_Fruits.cart.domain.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JpaCartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUserId(Long userId);
    Optional<CartItem> findByUserIdAndProductId(Long userId, Long productId);
    void deleteByUserId(Long userId);
    void deleteByUserIdAndProductId(Long userId, Long productId);
}
