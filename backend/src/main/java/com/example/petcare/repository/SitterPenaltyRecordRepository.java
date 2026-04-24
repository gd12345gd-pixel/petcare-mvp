package com.example.petcare.repository;


import com.example.petcare.entity.SitterPenaltyRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SitterPenaltyRecordRepository extends JpaRepository<SitterPenaltyRecord, Long> {

    List<SitterPenaltyRecord> findBySitterIdOrderByCreatedAtDesc(Long sitterId);

    List<SitterPenaltyRecord> findByOrderIdOrderByCreatedAtDesc(Long orderId);

    List<SitterPenaltyRecord> findBySitterIdAndPenaltyTypeOrderByCreatedAtDesc(
            Long sitterId,
            String penaltyType
    );
}
