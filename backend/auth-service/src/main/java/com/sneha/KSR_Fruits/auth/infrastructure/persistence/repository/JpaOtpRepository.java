package com.sneha.KSR_Fruits.auth.infrastructure.persistence.repository;

import com.sneha.KSR_Fruits.auth.infrastructure.persistence.entity.OtpEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JpaOtpRepository extends JpaRepository<OtpEntity, Long> {
    Optional<OtpEntity> findTopByEmailOrderByCreatedAtDesc(String email);
    void deleteByEmail(String email);
}
