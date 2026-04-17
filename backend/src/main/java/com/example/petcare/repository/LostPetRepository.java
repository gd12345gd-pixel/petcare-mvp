package com.example.petcare.repository;

import com.example.petcare.entity.LostPet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LostPetRepository extends JpaRepository<LostPet, Long> {
    List<LostPet> findByStatusOrderByCreatedAtDesc(String status);
    List<LostPet> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<LostPet> findByStatusAndDistrictOrderByCreatedAtDesc(String status, String district);
}