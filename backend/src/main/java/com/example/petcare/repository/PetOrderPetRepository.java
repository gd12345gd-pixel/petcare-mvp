package com.example.petcare.repository;

import com.example.petcare.entity.PetOrderPet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PetOrderPetRepository extends JpaRepository<PetOrderPet, Long> {

    List<PetOrderPet> findByOrderId(Long orderId);
}