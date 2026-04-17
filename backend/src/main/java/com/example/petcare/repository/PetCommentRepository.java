package com.example.petcare.repository;

import com.example.petcare.entity.PetComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PetCommentRepository extends JpaRepository<PetComment, Long> {
    List<PetComment> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, Long targetId);
}