package com.example.petcare.dto;

import lombok.Data;

@Data
public class CreateLostPetRequest {
    private Long userId;
    private String petName;
    private String breed;
    private String imageUrl;
    private String lostLocation;
    private String lostTime; // yyyy-MM-dd HH:mm:ss
    private String contact;
    private String rewardAmount;
    private String description;
    private Double latitude;
    private Double longitude;
    private String district;

}