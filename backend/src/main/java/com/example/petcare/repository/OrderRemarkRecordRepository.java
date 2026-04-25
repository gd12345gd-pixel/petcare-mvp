package com.example.petcare.repository;

import com.example.petcare.entity.OrderRemarkRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRemarkRecordRepository extends JpaRepository<OrderRemarkRecord, Long> {

    List<OrderRemarkRecord> findByOrderIdAndHiddenOrderByCreatedAtAsc(Long orderId, Integer hidden);
}
