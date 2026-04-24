package com.example.petcare.entity;



import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sitter_cancel_penalty_rule")
@Data
public class SitterCancelPenaltyRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ruleName;

    private BigDecimal minHoursBeforeStart;

    private BigDecimal maxHoursBeforeStart;

    private Integer creditChange;

    private BigDecimal depositPenaltyAmount;

    private String downgradeToLevel;

    private Boolean banSitter;

    private Boolean enabled;

    private Integer sortOrder;
}
