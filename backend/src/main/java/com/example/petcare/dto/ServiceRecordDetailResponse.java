package com.example.petcare.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ServiceRecordDetailResponse {
    private Long orderId;
    private String orderNo;
    private String serviceDate;
    private String timeSlot;
    private String address;
    private String status;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private List<ServiceRecordVO> records;
}