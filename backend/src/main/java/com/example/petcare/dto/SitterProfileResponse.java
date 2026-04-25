package com.example.petcare.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class SitterProfileResponse {

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
    private String introduction;
    private String idCardNo;
    private String idCardFrontUrl;
    private String idCardBackUrl;
    private String certificateUrl;
    private String levelCode;
    private String levelName;
    private Integer dailyOrderLimit;
    private Integer creditScore;
    private String depositStatus;
    private BigDecimal depositAmount;
    private Integer completedOrders;
    private Integer noShowCount;
    private Integer cancelCount;
    private String auditStatus;
    private String rejectReason;
    private Boolean canAcceptOrder;
    private String nextAction;
    private LocalDateTime submittedAt;
    private LocalDateTime auditedAt;
    private Long auditedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
