package com.example.petcare.repository;

import com.example.petcare.entity.Orders;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrdersRepository extends JpaRepository<Orders, Long> {

    List<Orders> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Orders> findByOrderNo(String orderNo);
}
