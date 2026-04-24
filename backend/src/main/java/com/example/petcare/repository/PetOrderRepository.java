package com.example.petcare.repository;

import com.example.petcare.entity.PetOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PetOrderRepository extends JpaRepository<PetOrder, Long> {

    Optional<PetOrder> findByIdAndDeleted(Long id, Integer deleted);

    List<PetOrder> findByUserIdAndDeletedOrderByIdDesc(Long userId, Integer deleted);

    Optional<PetOrder> findByIdAndUserIdAndDeleted(Long id, Long userId, Integer deleted);

    List<PetOrder> findByOrderStatusAndDeletedOrderByIdDesc(String orderStatus, Integer deleted);

    List<PetOrder> findBySitterIdAndDeletedOrderByIdDesc(Long sitterId, Integer deleted);
    boolean existsBySitterIdAndOrderStatusIn(Long sitterId, List<String> statuses);

    Optional<PetOrder> findByIdAndSitterIdAndDeleted(Long id, Long sitterId, Integer deleted);

    @Query("""
    select count(o) from PetOrder o
    where o.sitterId = :sitterId
    and o.createdAt >= :startTime
    and o.createdAt < :endTime
    and o.orderStatus in ('ACCEPTED', 'SERVING', 'COMPLETED')
""")
    int countTodayAcceptedOrders(
            @Param("sitterId") Long sitterId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );
}