package com.example.petcare.repository;

import com.example.petcare.entity.SitterDepositRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SitterDepositRuleRepository extends JpaRepository<SitterDepositRule, Long> {
    Optional<SitterDepositRule> findFirstByEnabledTrueOrderByIdDesc();
}
