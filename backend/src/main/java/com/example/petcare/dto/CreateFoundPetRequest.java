package com.example.petcare.dto;

import lombok.Data;

@Data
public class CreateFoundPetRequest {
    private Long userId;
    private String petName;
    private String breed;
    private String imageUrl;
    private String foundLocation;
    private String foundTime; // yyyy-MM-dd HH:mm:ss
    private String contact;
    private String description;
    private Boolean tempCare;
    private Double latitude;
    private Double longitude;
    private String district;
}