package com.example.petcare.repository;

import com.example.petcare.entity.PetOrderSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PetOrderScheduleRepository extends JpaRepository<PetOrderSchedule, Long> {

    List<PetOrderSchedule> findByOrderIdInOrderByServiceDateAsc(List<Long> orderIds);

    List<PetOrderSchedule> findByOrderIdOrderByServiceDateAsc(Long orderId);

    Optional<PetOrderSchedule> findByIdAndOrderId(Long id, Long orderId);

    long countByOrderIdAndScheduleStatus(Long orderId, String scheduleStatus);

    long countByOrderIdAndScheduleStatusIn(Long orderId, List<String> scheduleStatuses);

    Optional<PetOrderSchedule> findByIdAndOrderIdAndScheduleStatus(Long id, Long orderId, String scheduleStatus);



    boolean existsByOrderIdAndScheduleStatus(Long orderId, String scheduleStatus);
}