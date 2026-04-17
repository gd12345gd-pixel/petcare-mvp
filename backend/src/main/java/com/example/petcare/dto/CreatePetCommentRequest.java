package com.example.petcare.dto;

import lombok.Data;

@Data
public class CreatePetCommentRequest {
    private Long userId;
    private Long targetId;
    private String targetType; // LOST / FOUND
    private String content;

}