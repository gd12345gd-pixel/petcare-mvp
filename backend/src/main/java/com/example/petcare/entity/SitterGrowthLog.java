package com.example.petcare.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "sitter_growth_log")
@Data
public class SitterGrowthLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sitter_id", nullable = false)
    private Long sitterId;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "change_value", nullable = false)
    private Integer changeValue;

    @Column(name = "change_type", nullable = false, length = 32)
    private String changeType;

    @Column(nullable = false, length = 255)
    private String description;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
