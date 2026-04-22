package com.example.petcare.repository;

import com.example.petcare.entity.ServiceRecordImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceRecordImageRepository extends JpaRepository<ServiceRecordImage, Long> {

    List<ServiceRecordImage> findByRecordIdOrderBySortNoAscIdAsc(Long recordId);
}