package com.example.petcare.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sitter_profile")
@Data
public class SitterProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private String levelCode;

    private Integer creditScore;

    private String depositStatus;

    private BigDecimal depositAmount;

    private Integer completedOrders;

    private Integer noShowCount;

    private Integer cancelCount;

    private String auditStatus;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
