package com.sneha.KSR_Fruits.order.application.service;

import com.sneha.KSR_Fruits.common.dto.OrderEvent;
import com.sneha.KSR_Fruits.common.dto.OrderItemDto;
import com.sneha.KSR_Fruits.common.exception.BusinessException;
import com.sneha.KSR_Fruits.common.exception.ResourceNotFoundException;
import com.sneha.KSR_Fruits.order.domain.model.Order;
import com.sneha.KSR_Fruits.order.domain.model.OrderItem;
import com.sneha.KSR_Fruits.order.domain.repository.OrderRepository;
import com.sneha.KSR_Fruits.order.infrastructure.kafka.OrderProducer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);
    private static final String ADMIN_PHONE = "+919963983601";

    private final OrderRepository orderRepository;
    private final OrderProducer orderProducer;
    private final RestTemplate restTemplate;

    @Value("${auth.service.url:http://localhost:8081}")
    private String authServiceUrl;

    public OrderService(OrderRepository orderRepository, OrderProducer orderProducer, RestTemplate restTemplate) {
        this.orderRepository = orderRepository;
        this.orderProducer = orderProducer;
        this.restTemplate = restTemplate;
    }

    @Transactional
    public Order createOrder(Long userId, BigDecimal totalAmount, String deliveryAddress,
                             String paymentMethod, String paymentId, List<OrderItemDto> itemDtos) {

        // Validate profile completion via auth-service REST call
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> profile = restTemplate.getForObject(
                    authServiceUrl + "/api/auth/profile/" + userId, Map.class);
            if (profile != null) {
                Boolean profileComplete = (Boolean) profile.get("profileComplete");
                if (Boolean.FALSE.equals(profileComplete)) {
                    throw new BusinessException("Please complete your profile before placing an order.");
                }
                // Use stored address if none provided
                if (deliveryAddress == null || deliveryAddress.isBlank()) {
                    deliveryAddress = (String) profile.get("address");
                }
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Could not validate profile for userId={}: {}", userId, e.getMessage());
            // Allow order if auth-service is unreachable (graceful degradation)
        }

        Order order = new Order();
        order.setUserId(userId);
        order.setTotalAmount(totalAmount);
        order.setStatus("PLACED");
        order.setDeliveryAddress(deliveryAddress != null ? deliveryAddress : "Home Delivery");
        order.setPaymentId(paymentId != null && !paymentId.isBlank() ? paymentId : paymentMethod);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        for (OrderItemDto dto : itemDtos) {
            OrderItem item = new OrderItem();
            item.setProductId(dto.getProductId());
            item.setProductName(dto.getProductName());
            item.setQuantity(dto.getQuantity());
            item.setPrice(dto.getPrice());
            order.getItems().add(item);
        }

        order = orderRepository.save(order);

        OrderEvent event = new OrderEvent();
        event.setOrderId(order.getId());
        event.setUserId(userId);
        event.setTotalAmount(totalAmount);
        event.setStatus(order.getStatus());
        event.setItems(itemDtos);
        event.setEventType("ORDER_CREATED");
        orderProducer.sendOrderEvent(event);

        log.info("=== NEW ORDER #{} | User: {} | Total: ₹{} | Items: {} ===",
                order.getId(), userId, totalAmount, order.getItems().size());

        return order;
    }

    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));
    }

    public List<Order> getUserOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtAsc(userId);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtAsc();
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, String status) {
        Order order = getOrderById(orderId);
        order.setStatus(status);
        order.setUpdatedAt(LocalDateTime.now());
        order = orderRepository.save(order);

        OrderEvent event = new OrderEvent();
        event.setOrderId(order.getId());
        event.setUserId(order.getUserId());
        event.setTotalAmount(order.getTotalAmount());
        event.setStatus(status);
        event.setEventType("ORDER_STATUS_UPDATED");
        orderProducer.sendOrderEvent(event);

        return order;
    }
}
