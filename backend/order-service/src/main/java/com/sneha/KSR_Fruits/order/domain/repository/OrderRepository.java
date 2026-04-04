package com.sneha.KSR_Fruits.order.domain.repository;

import com.sneha.KSR_Fruits.order.domain.model.Order;

import java.util.List;
import java.util.Optional;

public interface OrderRepository {
    Order save(Order order);
    Optional<Order> findById(Long id);
    List<Order> findByUserIdOrderByCreatedAtAsc(Long userId);
    List<Order> findAllByOrderByCreatedAtAsc();
}
