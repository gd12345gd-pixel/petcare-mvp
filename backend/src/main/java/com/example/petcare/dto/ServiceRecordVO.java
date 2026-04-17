package com.example.petcare.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ServiceRecordVO {
    private Long id;
    private Long orderId;
    private String type;
    private String imageUrl;
    private String videoUrl;
    private String description;
    private String createdAt;
}