package com.example.petcare.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PetPostVO {
    private Long id;
    private String type; // LOST / FOUND
    private String petName;
    private String breed;
    private String imageUrl;
    private String location;
    private String timeText;
    private String rewardText;
    private String description;
    private String contact;
    private Boolean tempCare;
    private String status;

    private Double latitude;
    private Double longitude;

    private Double distanceKm;
    private String distanceText;
    private String province;
    private String city;
    private String district;
    private String adcode;
}