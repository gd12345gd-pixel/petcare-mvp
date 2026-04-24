package com.example.petcare.repository;

import com.example.petcare.entity.ServiceRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServiceRecordRepository extends JpaRepository<ServiceRecord, Long> {

    List<ServiceRecord> findByOrderIdOrderByIdDesc(Long orderId);

    Optional<ServiceRecord> findById(Long id);

    boolean existsByOrderIdAndScheduleId(Long orderId, Long scheduleId);


    List<ServiceRecord> findByOrderIdOrderBySubmittedAtDesc(Long orderId);
}