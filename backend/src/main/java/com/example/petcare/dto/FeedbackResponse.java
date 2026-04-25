package com.example.petcare.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FeedbackResponse {

    private Long id;
    private Long userId;
    private String feedbackType;
    private String content;
    private String contactPhone;
    private String orderNo;
    private String status;
    private LocalDateTime createdAt;
}
