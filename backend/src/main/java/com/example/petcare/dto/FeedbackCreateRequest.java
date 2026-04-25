package com.example.petcare.dto;

import lombok.Data;

@Data
public class FeedbackCreateRequest {

    private String feedbackType;
    private String content;
    private String contactPhone;
    private String orderNo;
}
