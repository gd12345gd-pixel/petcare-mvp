package com.example.petcare.repository;

import com.example.petcare.entity.ServiceRecord;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceRecordRepository extends JpaRepository<ServiceRecord, Long> {

    List<ServiceRecord> findByOrderIdOrderByCreatedAtAsc(Long orderId);
}
