package com.sneha.KSR_Fruits.order.interfaces.rest.controller;

import com.sneha.KSR_Fruits.order.application.service.BulkOrderService;
import com.sneha.KSR_Fruits.order.domain.model.BulkOrder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bulk-orders")
@CrossOrigin(origins = "*")
public class BulkOrderController {

    private final BulkOrderService bulkOrderService;

    public BulkOrderController(BulkOrderService bulkOrderService) {
        this.bulkOrderService = bulkOrderService;
    }

    /** POST /api/bulk-orders — user places a bulk order request */
    @PostMapping
    public ResponseEntity<BulkOrder> create(@RequestBody BulkOrder bulkOrder) {
        return ResponseEntity.ok(bulkOrderService.create(bulkOrder));
    }

    /** GET /api/bulk-orders — admin gets all bulk orders */
    @GetMapping
    public ResponseEntity<List<BulkOrder>> getAll() {
        return ResponseEntity.ok(bulkOrderService.getAll());
    }

    /** GET /api/bulk-orders/my?userId=1 — user gets their own bulk orders */
    @GetMapping("/my")
    public ResponseEntity<List<BulkOrder>> getByUser(@RequestParam Long userId) {
        return ResponseEntity.ok(bulkOrderService.getByUser(userId));
    }

    /** PUT /api/bulk-orders/:id/status — admin updates status */
    @PutMapping("/{id}/status")
    public ResponseEntity<BulkOrder> updateStatus(@PathVariable Long id,
                                                   @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(bulkOrderService.updateStatus(id, body.get("status")));
    }
}
