package com.example.petcare.repository;

import com.example.petcare.entity.SitterProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SitterProfileRepository extends JpaRepository<SitterProfile, Long> {
    Optional<SitterProfile> findByUserId(Long userId);
}