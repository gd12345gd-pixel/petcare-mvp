package com.example.petcare.repository;

import com.example.petcare.entity.FoundPet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FoundPetRepository extends JpaRepository<FoundPet, Long> {
    List<FoundPet> findByStatusOrderByCreatedAtDesc(String status);
    List<FoundPet> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<FoundPet> findByStatusAndDistrictOrderByCreatedAtDesc(String status, String district);
}