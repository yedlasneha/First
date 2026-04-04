package com.sneha.KSR_Fruits.order.infrastructure.persistence.repository;

import com.sneha.KSR_Fruits.order.domain.model.Order;
import com.sneha.KSR_Fruits.order.domain.model.OrderItem;
import com.sneha.KSR_Fruits.order.domain.repository.OrderRepository;
import com.sneha.KSR_Fruits.order.infrastructure.persistence.entity.OrderEntity;
import com.sneha.KSR_Fruits.order.infrastructure.persistence.entity.OrderItemEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class OrderRepositoryImpl implements OrderRepository {

    private final JpaOrderRepository jpa;

    public OrderRepositoryImpl(JpaOrderRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public Order save(Order order) {
        return toDomain(jpa.save(toEntity(order)));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public Optional<Order> findById(Long id) {
        return jpa.findById(id).map(this::toDomain);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<Order> findByUserIdOrderByCreatedAtAsc(Long userId) {
        return jpa.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<Order> findAllByOrderByCreatedAtAsc() {
        return jpa.findAllByOrderByCreatedAtAsc().stream()
                .map(this::toDomain).collect(Collectors.toList());
    }

    private OrderEntity toEntity(Order o) {
        OrderEntity e = new OrderEntity();
        e.setId(o.getId());
        e.setUserId(o.getUserId());
        e.setTotalAmount(o.getTotalAmount());
        e.setStatus(o.getStatus());
        e.setDeliveryAddress(o.getDeliveryAddress());
        e.setPaymentId(o.getPaymentId());
        if (o.getCreatedAt() != null) e.setCreatedAt(o.getCreatedAt());
        if (o.getUpdatedAt() != null) e.setUpdatedAt(o.getUpdatedAt());

        for (OrderItem item : o.getItems()) {
            OrderItemEntity ie = new OrderItemEntity();
            ie.setOrder(e);
            ie.setProductId(item.getProductId());
            ie.setProductName(item.getProductName());
            ie.setQuantity(item.getQuantity());
            ie.setPrice(item.getPrice());
            e.getItems().add(ie);
        }
        return e;
    }

    private Order toDomain(OrderEntity e) {
        Order o = new Order();
        o.setId(e.getId());
        o.setUserId(e.getUserId());
        o.setTotalAmount(e.getTotalAmount());
        o.setStatus(e.getStatus());
        o.setDeliveryAddress(e.getDeliveryAddress());
        o.setPaymentId(e.getPaymentId());
        o.setCreatedAt(e.getCreatedAt());
        o.setUpdatedAt(e.getUpdatedAt());

        List<OrderItem> items = e.getItems().stream().map(ie -> {
            OrderItem item = new OrderItem();
            item.setId(ie.getId());
            item.setOrderId(e.getId());
            item.setProductId(ie.getProductId());
            item.setProductName(ie.getProductName());
            item.setQuantity(ie.getQuantity());
            item.setPrice(ie.getPrice());
            return item;
        }).collect(Collectors.toList());
        o.setItems(items);
        return o;
    }
}
