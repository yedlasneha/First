package com.sneha.KSR_Fruits.order.application.service;

import com.sneha.KSR_Fruits.order.domain.model.BulkOrder;
import com.sneha.KSR_Fruits.order.infrastructure.persistence.entity.BulkOrderEntity;
import com.sneha.KSR_Fruits.order.infrastructure.persistence.repository.JpaBulkOrderRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BulkOrderService {

    private final JpaBulkOrderRepository repo;

    public BulkOrderService(JpaBulkOrderRepository repo) {
        this.repo = repo;
    }

    public BulkOrder create(BulkOrder b) {
        BulkOrderEntity e = toEntity(b);
        e.setStatus("PENDING");
        e.setCreatedAt(LocalDateTime.now());
        return toDomain(repo.save(e));
    }

    public List<BulkOrder> getAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream().map(this::toDomain).collect(Collectors.toList());
    }

    public List<BulkOrder> getByUser(Long userId) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId).stream().map(this::toDomain).collect(Collectors.toList());
    }

    public BulkOrder updateStatus(Long id, String status) {
        BulkOrderEntity e = repo.findById(id).orElseThrow(() -> new RuntimeException("Bulk order not found: " + id));
        e.setStatus(status);
        return toDomain(repo.save(e));
    }

    private BulkOrderEntity toEntity(BulkOrder b) {
        BulkOrderEntity e = new BulkOrderEntity();
        e.setUserId(b.getUserId());
        e.setFruitName(b.getFruitName());
        e.setQuantity(b.getQuantity());
        e.setUnit(b.getUnit() != null ? b.getUnit() : "kg");
        e.setDeliveryDate(b.getDeliveryDate());
        e.setNotes(b.getNotes());
        return e;
    }

    private BulkOrder toDomain(BulkOrderEntity e) {
        BulkOrder b = new BulkOrder();
        b.setId(e.getId());
        b.setUserId(e.getUserId());
        b.setFruitName(e.getFruitName());
        b.setQuantity(e.getQuantity());
        b.setUnit(e.getUnit());
        b.setDeliveryDate(e.getDeliveryDate());
        b.setNotes(e.getNotes());
        b.setStatus(e.getStatus());
        b.setCreatedAt(e.getCreatedAt());
        return b;
    }
}
