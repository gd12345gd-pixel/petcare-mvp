package com.example.petcare.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "found_pet")
public class FoundPet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private String petName;

    private String breed;

    private String imageUrl;

    private String foundLocation;

    private LocalDateTime foundTime;

    private String contact;

    private String description;

    private Boolean tempCare;

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