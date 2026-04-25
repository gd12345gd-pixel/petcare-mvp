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

    private String realName;

    private String phone;

    private String gender;

    private Integer age;

    private String city;

    private String serviceArea;

    private String petTypes;

    private String experience;

    private Boolean hasPetExperience;

    private String availableTimes;

    @Column(length = 1000)
    private String introduction;

    private String idCardNo;

    @Column(length = 500)
    private String idCardFrontUrl;

    @Column(length = 500)
    private String idCardBackUrl;

    @Column(length = 500)
    private String certificateUrl;

    private String levelCode;

    private Integer creditScore;

    private String depositStatus;

    private BigDecimal depositAmount;

    private Integer completedOrders;

    private Integer noShowCount;

    private Integer cancelCount;

    private String auditStatus;

    @Column(length = 500)
    private String rejectReason;

    private LocalDateTime submittedAt;

    private LocalDateTime auditedAt;

    private Long auditedBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
