package com.example.petcare.repository;

import com.example.petcare.entity.PetOrderLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PetOrderLogRepository extends JpaRepository<PetOrderLog, Long> {
}