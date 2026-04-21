package com.example.petcare.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Setter
@Getter
public class CreateOrderRequest {

    private Long userId;

    private Long addressId;
    private String serviceContactName;
    private String serviceContactPhone;
    private String serviceProvince;
    private String serviceCity;
    private String serviceDistrict;
    private String serviceDetailAddress;
    private BigDecimal serviceLatitude;
    private BigDecimal serviceLongitude;

    private List<Long> petIds;
    private Integer petCount;

    private List<String> serviceDates;
    private List<String> timeSlots;
    private Integer serviceDurationMinutes;

    private BigDecimal suggestedUnitPrice;
    private BigDecimal serviceFee;
    private BigDecimal totalPrice;

    private String remark;
    private String specialRequirement;

}