package com.sneha.KSR_Fruits.auth.domain.repository;

import com.sneha.KSR_Fruits.auth.domain.model.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository {
    User save(User user);
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    Optional<User> findById(Long id);
    List<User> findAll();
}
