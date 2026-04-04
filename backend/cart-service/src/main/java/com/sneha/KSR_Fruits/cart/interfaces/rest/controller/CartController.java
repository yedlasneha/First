package com.sneha.KSR_Fruits.cart.interfaces.rest.controller;

import com.sneha.KSR_Fruits.cart.application.service.CartService;
import com.sneha.KSR_Fruits.cart.domain.model.CartItem;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @PostMapping("/add")
    public ResponseEntity<CartItem> addToCart(@RequestBody Map<String, Object> request) {
        Long userId    = Long.valueOf(request.get("userId").toString());
        Long productId = Long.valueOf(request.get("productId").toString());
        Integer qty    = Integer.valueOf(request.get("quantity").toString());
        BigDecimal price = new BigDecimal(request.get("price").toString());
        String name    = request.get("productName").toString();
        return ResponseEntity.ok(cartService.addToCart(userId, productId, qty, price, name));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<CartItem>> getCart(@PathVariable("userId") Long userId) {
        return ResponseEntity.ok(cartService.getCart(userId));
    }

    @PutMapping("/update")
    public ResponseEntity<Void> updateQuantity(@RequestBody Map<String, Object> request) {
        cartService.updateQuantity(
                Long.valueOf(request.get("userId").toString()),
                Long.valueOf(request.get("productId").toString()),
                Integer.valueOf(request.get("quantity").toString()));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{userId}/{productId}")
    public ResponseEntity<Void> removeFromCart(
            @PathVariable("userId") Long userId,
            @PathVariable("productId") Long productId) {
        cartService.removeFromCart(userId, productId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/clear/{userId}")
    public ResponseEntity<Void> clearCart(@PathVariable("userId") Long userId) {
        cartService.clearCart(userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/total/{userId}")
    public ResponseEntity<Map<String, BigDecimal>> getCartTotal(@PathVariable("userId") Long userId) {
        return ResponseEntity.ok(Map.of("total", cartService.getCartTotal(userId)));
    }
}
