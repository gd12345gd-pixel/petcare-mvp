package com.example.petcare.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pet_order")
@Data
public class PetOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_no", nullable = false, length = 32, unique = true)
    private String orderNo;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "order_status", nullable = false, length = 32)
    private String orderStatus;

    @Column(name = "pay_status", nullable = false, length = 32)
    private String payStatus;

    @Column(name = "pay_type", nullable = false, length = 32)
    private String payType;

    @Column(name = "address_id")
    private Long addressId;

    @Column(name = "service_contact_name", length = 50)
    private String serviceContactName;

    @Column(name = "service_contact_phone", length = 20)
    private String serviceContactPhone;

    @Column(name = "service_province", length = 50)
    private String serviceProvince;

    @Column(name = "service_city", length = 50)
    private String serviceCity;

    @Column(name = "service_district", length = 50)
    private String serviceDistrict;

    @Column(name = "service_detail_address", length = 255)
    private String serviceDetailAddress;

    @Column(name = "service_latitude", precision = 10, scale = 7)
    private BigDecimal serviceLatitude;

    @Column(name = "service_longitude", precision = 10, scale = 7)
    private BigDecimal serviceLongitude;

    @Column(name = "pet_count", nullable = false)
    private Integer petCount = 0;

    @Column(name = "service_date_count", nullable = false)
    private Integer serviceDateCount = 0;

    @Column(name = "service_duration_minutes", nullable = false)
    private Integer serviceDurationMinutes = 0;

    @Column(name = "time_slots_json", columnDefinition = "json")
    private String timeSlotsJson;

    @Column(length = 1000)
    private String remark;

    @Column(name = "special_requirement", length = 1000)
    private String specialRequirement;

    @Column(name = "suggested_unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal suggestedUnitPrice = BigDecimal.ZERO;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice = BigDecimal.ZERO;

    @Column(length = 32)
    private String source = "MINI_APP";

    @Column(nullable = false)
    private Integer deleted = 0;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @Column(name = "sitter_id")
    private Long sitterId;

    @Column(name = "taken_at")
    private LocalDateTime takenAt;

    @Column(name = "service_started_at")
    private LocalDateTime serviceStartedAt;

    @Column(name = "service_completed_at")
    private LocalDateTime serviceCompletedAt;

    public Long getId() { return id; }

    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }

    public String getPayStatus() { return payStatus; }
    public void setPayStatus(String payStatus) { this.payStatus = payStatus; }

    public String getPayType() { return payType; }
    public void setPayType(String payType) { this.payType = payType; }

    public Long getAddressId() { return addressId; }
    public void setAddressId(Long addressId) { this.addressId = addressId; }

    public String getServiceContactName() { return serviceContactName; }
    public void setServiceContactName(String serviceContactName) { this.serviceContactName = serviceContactName; }

    public String getServiceContactPhone() { return serviceContactPhone; }
    public void setServiceContactPhone(String serviceContactPhone) { this.serviceContactPhone = serviceContactPhone; }

    public String getServiceProvince() { return serviceProvince; }
    public void setServiceProvince(String serviceProvince) { this.serviceProvince = serviceProvince; }

    public String getServiceCity() { return serviceCity; }
    public void setServiceCity(String serviceCity) { this.serviceCity = serviceCity; }

    public String getServiceDistrict() { return serviceDistrict; }
    public void setServiceDistrict(String serviceDistrict) { this.serviceDistrict = serviceDistrict; }

    public String getServiceDetailAddress() { return serviceDetailAddress; }
    public void setServiceDetailAddress(String serviceDetailAddress) { this.serviceDetailAddress = serviceDetailAddress; }

    public BigDecimal getServiceLatitude() { return serviceLatitude; }
    public void setServiceLatitude(BigDecimal serviceLatitude) { this.serviceLatitude = serviceLatitude; }

    public BigDecimal getServiceLongitude() { return serviceLongitude; }
    public void setServiceLongitude(BigDecimal serviceLongitude) { this.serviceLongitude = serviceLongitude; }

    public Integer getPetCount() { return petCount; }
    public void setPetCount(Integer petCount) { this.petCount = petCount; }

    public Integer getServiceDateCount() { return serviceDateCount; }
    public void setServiceDateCount(Integer serviceDateCount) { this.serviceDateCount = serviceDateCount; }

    public Integer getServiceDurationMinutes() { return serviceDurationMinutes; }
    public void setServiceDurationMinutes(Integer serviceDurationMinutes) { this.serviceDurationMinutes = serviceDurationMinutes; }

    public String getTimeSlotsJson() { return timeSlotsJson; }
    public void setTimeSlotsJson(String timeSlotsJson) { this.timeSlotsJson = timeSlotsJson; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }

    public String getSpecialRequirement() { return specialRequirement; }
    public void setSpecialRequirement(String specialRequirement) { this.specialRequirement = specialRequirement; }

    public BigDecimal getSuggestedUnitPrice() { return suggestedUnitPrice; }
    public void setSuggestedUnitPrice(BigDecimal suggestedUnitPrice) { this.suggestedUnitPrice = suggestedUnitPrice; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public Integer getDeleted() { return deleted; }
    public void setDeleted(Integer deleted) { this.deleted = deleted; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}