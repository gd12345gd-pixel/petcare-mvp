package com.example.petcare.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sitter_level_rule")
@Data
public class SitterLevelRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String levelCode;

    private String levelName;

    private Integer dailyOrderLimit;

    private Integer requiredCompletedOrders;

    private Integer requiredCreditScore;

    private Boolean allowNoShow;

    private Boolean enabled;

    private Integer sortOrder;
}