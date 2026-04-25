package com.example.petcare.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "user_feedback")
public class UserFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private String feedbackType;

    @Column(length = 1000)
    private String content;

    private String contactPhone;

    private String orderNo;

    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
