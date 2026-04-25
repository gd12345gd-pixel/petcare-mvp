package com.example.petcare.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "user_notification")
public class UserNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private String noticeType;

    private String title;

    @Column(length = 1000)
    private String content;

    private String targetType;

    private Long targetId;

    @Column(length = 500)
    private String targetUrl;

    private Boolean readFlag;

    private LocalDateTime readAt;

    private LocalDateTime createdAt;
}
