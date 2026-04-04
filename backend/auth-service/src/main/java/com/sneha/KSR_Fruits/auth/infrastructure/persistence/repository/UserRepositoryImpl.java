package com.sneha.KSR_Fruits.auth.infrastructure.persistence.repository;

import com.sneha.KSR_Fruits.auth.domain.model.User;
import com.sneha.KSR_Fruits.auth.domain.repository.UserRepository;
import com.sneha.KSR_Fruits.auth.infrastructure.persistence.entity.UserEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class UserRepositoryImpl implements UserRepository {

    private final JpaUserRepository jpa;

    public UserRepositoryImpl(JpaUserRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public User save(User user) {
        return toDomain(jpa.save(toEntity(user)));
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return jpa.findByEmail(email).map(this::toDomain);
    }

    @Override
    public Optional<User> findByPhone(String phone) {
        return jpa.findByPhone(phone).map(this::toDomain);
    }

    @Override
    public boolean existsByEmail(String email) {
        return jpa.existsByEmail(email);
    }

    @Override
    public boolean existsByPhone(String phone) {
        return jpa.existsByPhone(phone);
    }

    @Override
    public Optional<User> findById(Long id) {
        return jpa.findById(id).map(this::toDomain);
    }

    @Override
    public List<User> findAll() {
        return jpa.findAll().stream().map(this::toDomain).collect(Collectors.toList());
    }

    private UserEntity toEntity(User u) {
        UserEntity e = new UserEntity();
        e.setId(u.getId());
        e.setName(u.getName());
        e.setEmail(u.getEmail());
        e.setRole(u.getRole() != null ? u.getRole() : "USER");
        e.setPhone(u.getPhone());
        e.setAddress(u.getAddress());
        e.setReceiverName(u.getReceiverName());
        e.setReceiverMobile(u.getReceiverMobile());
        e.setProfileComplete(u.getProfileComplete() != null ? u.getProfileComplete() : false);
        if (u.getCreatedAt() != null) e.setCreatedAt(u.getCreatedAt());
        if (u.getUpdatedAt() != null) e.setUpdatedAt(u.getUpdatedAt());
        return e;
    }

    private User toDomain(UserEntity e) {
        User u = new User();
        u.setId(e.getId());
        u.setName(e.getName());
        u.setEmail(e.getEmail());
        u.setRole(e.getRole());
        u.setPhone(e.getPhone());
        u.setAddress(e.getAddress());
        u.setReceiverName(e.getReceiverName());
        u.setReceiverMobile(e.getReceiverMobile());
        u.setProfileComplete(e.getProfileComplete());
        u.setCreatedAt(e.getCreatedAt());
        u.setUpdatedAt(e.getUpdatedAt());
        return u;
    }
}
