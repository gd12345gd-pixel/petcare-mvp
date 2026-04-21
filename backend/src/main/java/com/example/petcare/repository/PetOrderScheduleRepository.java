package com.example.petcare.repository;

import com.example.petcare.entity.PetOrderSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PetOrderScheduleRepository extends JpaRepository<PetOrderSchedule, Long> {
    List<PetOrderSchedule> findByOrderIdInOrderByServiceDateAsc(List<Long> orderIds);

    List<PetOrderSchedule> findByOrderIdOrderByServiceDateAsc(Long orderId);
}