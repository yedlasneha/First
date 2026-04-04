package com.sneha.KSR_Fruits.order.interfaces.rest.controller;

import com.sneha.KSR_Fruits.common.dto.OrderItemDto;
import com.sneha.KSR_Fruits.order.application.service.OrderService;
import com.sneha.KSR_Fruits.order.domain.model.Order;
import com.sneha.KSR_Fruits.order.interfaces.dto.PlaceOrderRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /** POST /api/orders — place a new order */
    @PostMapping
    public ResponseEntity<Order> placeOrder(@RequestBody PlaceOrderRequest req) {
        List<OrderItemDto> items = req.getItems().stream().map(i -> {
            OrderItemDto dto = new OrderItemDto();
            dto.setProductId(i.getProductId());
            dto.setProductName(i.getProductName());
            dto.setQuantity(i.getQuantity());
            dto.setPrice(i.getPrice());
            return dto;
        }).toList();

        Order order = orderService.createOrder(
                req.getUserId(),
                req.getTotalAmount(),
                req.getDeliveryAddress() != null ? req.getDeliveryAddress() : "Home Delivery",
                req.getPaymentMethod(),
                req.getPaymentId(),
                items
        );
        return ResponseEntity.ok(order);
    }

    /** GET /api/orders/my?userId=1 */
    @GetMapping("/my")
    public ResponseEntity<List<Order>> getMyOrders(@RequestParam("userId") Long userId) {
        return ResponseEntity.ok(orderService.getUserOrders(userId));
    }

    /** GET /api/orders/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }
}
