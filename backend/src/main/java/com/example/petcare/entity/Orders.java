package com.example.petcare.entity;

import com.example.petcare.enums.OrderStatus;
import com.example.petcare.enums.PaymentStatus;
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
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "orders")
public class Orders {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String orderNo;
    private Long userId;
    private Long sitterId;
    private Long serviceItemId;
    private LocalDate serviceDate;
    private String timeSlot;
    private String address;
    private String contactName;
    private String contactPhone;
    private String note;
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    private OrderStatus  status;

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private LocalDateTime startTime;

    private LocalDateTime endTime;
}
