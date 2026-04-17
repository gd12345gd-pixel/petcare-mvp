package com.example.petcare.repository;

import com.example.petcare.entity.Sitter;
import com.example.petcare.enums.SitterStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SitterRepository extends JpaRepository<Sitter, Long> {

    List<Sitter> findByStatusOrderByRatingDesc(SitterStatus status);
}
