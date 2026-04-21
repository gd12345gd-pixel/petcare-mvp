package com.example.petcare.repository;

import com.example.petcare.entity.PetOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PetOrderRepository extends JpaRepository<PetOrder, Long> {

    Optional<PetOrder> findByIdAndDeleted(Long id, Integer deleted);

    List<PetOrder> findByUserIdAndDeletedOrderByIdDesc(Long userId, Integer deleted);

    Optional<PetOrder> findByIdAndUserIdAndDeleted(Long id, Long userId, Integer deleted);
}