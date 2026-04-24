package com.example.petcare.repository;

import com.example.petcare.entity.ServiceRecordItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceRecordItemRepository extends JpaRepository<ServiceRecordItem, Long> {

    List<ServiceRecordItem> findByRecordId(Long recordId);
}