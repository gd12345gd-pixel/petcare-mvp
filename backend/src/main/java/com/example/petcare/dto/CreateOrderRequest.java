package com.example.petcare.dto;

import lombok.Data;

@Data
public class CreateOrderRequest {
    private Long userId;
    private Long sitterId;
    private Long serviceItemId;
    private String serviceDate;
    private String timeSlot;
    private String address;
    private String contactName;
    private String contactPhone;
    private String note;
}