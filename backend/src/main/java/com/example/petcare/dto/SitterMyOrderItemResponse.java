package com.example.petcare.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class SitterMyOrderItemResponse {

    private Long id;
    private String orderNo;
    private String orderStatus;

    private Integer petCount;
    private Integer serviceDateCount;
    private Integer serviceDurationMinutes;

    private String serviceProvince;
    private String serviceCity;
    private String serviceDistrict;
    private String serviceDetailAddress;

    private BigDecimal unitPrice;
    private BigDecimal totalPrice;

    private String remark;
    private List<String> timeSlots;
    private String firstServiceDate;
    /** 全部上门日期，与可接订单列表一致，供「今日服务」筛选 */
    private List<String> serviceDates;
    private Integer completedServiceCount;

    private Double distanceKm;
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }

    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }

    public Integer getPetCount() { return petCount; }
    public void setPetCount(Integer petCount) { this.petCount = petCount; }

    public Integer getServiceDateCount() { return serviceDateCount; }
    public void setServiceDateCount(Integer serviceDateCount) { this.serviceDateCount = serviceDateCount; }

    public Integer getServiceDurationMinutes() { return serviceDurationMinutes; }
    public void setServiceDurationMinutes(Integer serviceDurationMinutes) { this.serviceDurationMinutes = serviceDurationMinutes; }

    public String getServiceProvince() { return serviceProvince; }
    public void setServiceProvince(String serviceProvince) { this.serviceProvince = serviceProvince; }

    public String getServiceCity() { return serviceCity; }
    public void setServiceCity(String serviceCity) { this.serviceCity = serviceCity; }

    public String getServiceDistrict() { return serviceDistrict; }
    public void setServiceDistrict(String serviceDistrict) { this.serviceDistrict = serviceDistrict; }

    public String getServiceDetailAddress() { return serviceDetailAddress; }
    public void setServiceDetailAddress(String serviceDetailAddress) { this.serviceDetailAddress = serviceDetailAddress; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }

    public List<String> getTimeSlots() { return timeSlots; }
    public void setTimeSlots(List<String> timeSlots) { this.timeSlots = timeSlots; }

    public String getFirstServiceDate() { return firstServiceDate; }
    public void setFirstServiceDate(String firstServiceDate) { this.firstServiceDate = firstServiceDate; }

    public List<String> getServiceDates() { return serviceDates; }
    public void setServiceDates(List<String> serviceDates) { this.serviceDates = serviceDates; }

    public Integer getCompletedServiceCount() { return completedServiceCount; }
    public void setCompletedServiceCount(Integer completedServiceCount) { this.completedServiceCount = completedServiceCount; }
}