package com.example.petcare.entity;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "sitter_penalty_record")
public class SitterPenaltyRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 接单师ID
     */
    @Column(name = "sitter_id", nullable = false)
    private Long sitterId;

    /**
     * 订单ID
     */
    @Column(name = "order_id")
    private Long orderId;

    /**
     * 处罚类型：CANCEL / NO_SHOW / COMPLAINT
     */
    @Column(name = "penalty_type", nullable = false, length = 30)
    private String penaltyType;

    /**
     * 处罚原因
     */
    @Column(name = "reason")
    private String reason;

    /**
     * 信誉分变化，扣分为负数
     */
    @Column(name = "credit_change", nullable = false)
    private Integer creditChange = 0;

    /**
     * 扣押金金额
     */
    @Column(name = "deposit_penalty_amount", nullable = false)
    private BigDecimal depositPenaltyAmount = BigDecimal.ZERO;

    @Column(name = "before_credit_score")
    private Integer beforeCreditScore;

    @Column(name = "after_credit_score")
    private Integer afterCreditScore;

    @Column(name = "before_deposit_amount")
    private BigDecimal beforeDepositAmount;

    @Column(name = "after_deposit_amount")
    private BigDecimal afterDepositAmount;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (creditChange == null) {
            creditChange = 0;
        }
        if (depositPenaltyAmount == null) {
            depositPenaltyAmount = BigDecimal.ZERO;
        }
    }
}