package com.example.petcare.entity;


import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sitter_deposit_rule")
@Data
public class SitterDepositRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ruleName;

    private BigDecimal depositAmount;

    private Boolean requiredForAcceptOrder;

    private Boolean refundableWhenNoActiveOrder;

    private Boolean enabled;
}