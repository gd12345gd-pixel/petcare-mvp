package com.example.petcare.repository;

import com.example.petcare.entity.ServiceRecordMedia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceRecordMediaRepository extends JpaRepository<ServiceRecordMedia, Long> {

    List<ServiceRecordMedia> findByRecordIdOrderBySortNoAscIdAsc(Long recordId);
}