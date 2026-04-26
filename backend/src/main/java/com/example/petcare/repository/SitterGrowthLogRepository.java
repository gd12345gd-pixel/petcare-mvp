package com.example.petcare.repository;

import com.example.petcare.entity.SitterGrowthLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SitterGrowthLogRepository extends JpaRepository<SitterGrowthLog, Long> {

    List<SitterGrowthLog> findTop20BySitterIdOrderByIdDesc(Long sitterId);
}
