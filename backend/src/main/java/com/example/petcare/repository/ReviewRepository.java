package com.example.petcare.repository;

import com.example.petcare.entity.Review;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findBySitterIdOrderByCreatedAtDesc(Long sitterId);

    List<Review> findByOrderId(Long orderId);
}
