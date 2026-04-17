package com.example.petcare.dto;

import lombok.Data;

@Data
public class CreateServiceRecordRequest {
    private Long orderId;
    private String type;
    private String imageUrl;
    private String videoUrl;
    private String description;
}