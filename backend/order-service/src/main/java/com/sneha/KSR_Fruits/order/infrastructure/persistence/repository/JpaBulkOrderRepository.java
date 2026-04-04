package com.sneha.KSR_Fruits.order.infrastructure.persistence.repository;

import com.sneha.KSR_Fruits.order.infrastructure.persistence.entity.BulkOrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JpaBulkOrderRepository extends JpaRepository<BulkOrderEntity, Long> {
    List<BulkOrderEntity> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<BulkOrderEntity> findAllByOrderByCreatedAtDesc();
}
