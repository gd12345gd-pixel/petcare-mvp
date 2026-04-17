package com.example.petcare.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "lost_pet")
public class LostPet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private String petName;

    private String breed;

    private String imageUrl;

    private String lostLocation;

    private LocalDateTime lostTime;

    private String contact;

    private BigDecimal rewardAmount;

    private String description;

    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Double latitude;
    private Double longitude;
    private String province;
    private String city;
    private String district;
    private String adcode;
}