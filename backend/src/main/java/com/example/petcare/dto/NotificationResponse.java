package com.example.petcare.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationResponse {

    private Long id;
    private Long userId;
    private String noticeType;
    private String title;
    private String content;
    private String targetType;
    private Long targetId;
    private String targetUrl;
    private Boolean readFlag;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
}
