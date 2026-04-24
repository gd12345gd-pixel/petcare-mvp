package com.example.petcare.repository;

import com.example.petcare.entity.SitterLevelRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SitterLevelRuleRepository extends JpaRepository<SitterLevelRule, Long> {
    Optional<SitterLevelRule> findByLevelCodeAndEnabledTrue(String levelCode);

    List<SitterLevelRule> findByEnabledTrueOrderBySortOrderAsc();
}
