package com.example.petcare.entity;

import com.example.petcare.enums.SitterStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "sitter")
public class Sitter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String realName;
    private String intro;
    private Integer yearsOfExperience;
    private BigDecimal rating;
    private Integer serviceCount;
    private BigDecimal distanceKm;
    private Boolean verified;
    private Boolean videoRecordEnabled;

    @Enumerated(EnumType.STRING)
    private SitterStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
