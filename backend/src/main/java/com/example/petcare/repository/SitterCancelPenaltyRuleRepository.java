package com.example.petcare.repository;

import com.example.petcare.entity.SitterCancelPenaltyRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SitterCancelPenaltyRuleRepository extends JpaRepository<SitterCancelPenaltyRule, Long> {
    List<SitterCancelPenaltyRule> findByEnabledTrueOrderBySortOrderAsc();
}
