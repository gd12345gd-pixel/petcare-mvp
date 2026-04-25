package com.example.petcare.repository;

import com.example.petcare.entity.UserFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserFeedbackRepository extends JpaRepository<UserFeedback, Long> {

    List<UserFeedback> findByUserIdOrderByCreatedAtDesc(Long userId);
}
