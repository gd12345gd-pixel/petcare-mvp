package com.example.petcare.dto;

import java.math.BigDecimal;
import java.util.List;

public class OrderDetailResponse {

    private Long id;
    private String orderNo;
    private String orderStatus;
    private String payStatus;
    private String createdAt;
    private String takenAt;
    private Long sitterId;
    private String sitterName;
    private String sitterPhone;
    private Long addressId;
    private Boolean canReschedule;
    private Integer rescheduleCount;
    private Integer maxRescheduleCount;

    private String serviceContactName;
    private String serviceContactPhone;
    private String serviceFullAddress;

    private Integer petCount;
    private Integer serviceDateCount;
    private Integer serviceDurationMinutes;

    private List<String> timeSlots;
    private List<OrderPetItemResponse> pets;
    private List<OrderScheduleItemResponse> serviceDates;
    private List<OrderRemarkResponse> remarkTimeline;
    private Boolean canAppendRemark;
    private Boolean canReview;
    private Boolean reviewed;
    private ReviewResponse review;

    private BigDecimal suggestedUnitPrice;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;

    private String remark;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }

    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }

    public String getPayStatus() { return payStatus; }
    public void setPayStatus(String payStatus) { this.payStatus = payStatus; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getTakenAt() { return takenAt; }
    public void setTakenAt(String takenAt) { this.takenAt = takenAt; }

    public Long getSitterId() { return sitterId; }
    public void setSitterId(Long sitterId) { this.sitterId = sitterId; }

    public String getSitterName() { return sitterName; }
    public void setSitterName(String sitterName) { this.sitterName = sitterName; }

    public String getSitterPhone() { return sitterPhone; }
    public void setSitterPhone(String sitterPhone) { this.sitterPhone = sitterPhone; }

    public Long getAddressId() { return addressId; }
    public void setAddressId(Long addressId) { this.addressId = addressId; }

    public Boolean getCanReschedule() { return canReschedule; }
    public void setCanReschedule(Boolean canReschedule) { this.canReschedule = canReschedule; }

    public Integer getRescheduleCount() { return rescheduleCount; }
    public void setRescheduleCount(Integer rescheduleCount) { this.rescheduleCount = rescheduleCount; }

    public Integer getMaxRescheduleCount() { return maxRescheduleCount; }
    public void setMaxRescheduleCount(Integer maxRescheduleCount) { this.maxRescheduleCount = maxRescheduleCount; }

    public String getServiceContactName() { return serviceContactName; }
    public void setServiceContactName(String serviceContactName) { this.serviceContactName = serviceContactName; }

    public String getServiceContactPhone() { return serviceContactPhone; }
    public void setServiceContactPhone(String serviceContactPhone) { this.serviceContactPhone = serviceContactPhone; }

    public String getServiceFullAddress() { return serviceFullAddress; }
    public void setServiceFullAddress(String serviceFullAddress) { this.serviceFullAddress = serviceFullAddress; }

    public Integer getPetCount() { return petCount; }
    public void setPetCount(Integer petCount) { this.petCount = petCount; }

    public Integer getServiceDateCount() { return serviceDateCount; }
    public void setServiceDateCount(Integer serviceDateCount) { this.serviceDateCount = serviceDateCount; }

    public Integer getServiceDurationMinutes() { return serviceDurationMinutes; }
    public void setServiceDurationMinutes(Integer serviceDurationMinutes) { this.serviceDurationMinutes = serviceDurationMinutes; }

    public List<String> getTimeSlots() { return timeSlots; }
    public void setTimeSlots(List<String> timeSlots) { this.timeSlots = timeSlots; }

    public List<OrderPetItemResponse> getPets() { return pets; }
    public void setPets(List<OrderPetItemResponse> pets) { this.pets = pets; }

    public List<OrderScheduleItemResponse> getServiceDates() { return serviceDates; }
    public void setServiceDates(List<OrderScheduleItemResponse> serviceDates) { this.serviceDates = serviceDates; }

    public List<OrderRemarkResponse> getRemarkTimeline() { return remarkTimeline; }
    public void setRemarkTimeline(List<OrderRemarkResponse> remarkTimeline) { this.remarkTimeline = remarkTimeline; }

    public Boolean getCanAppendRemark() { return canAppendRemark; }
    public void setCanAppendRemark(Boolean canAppendRemark) { this.canAppendRemark = canAppendRemark; }

    public Boolean getCanReview() { return canReview; }
    public void setCanReview(Boolean canReview) { this.canReview = canReview; }

    public Boolean getReviewed() { return reviewed; }
    public void setReviewed(Boolean reviewed) { this.reviewed = reviewed; }

    public ReviewResponse getReview() { return review; }
    public void setReview(ReviewResponse review) { this.review = review; }

    public BigDecimal getSuggestedUnitPrice() { return suggestedUnitPrice; }
    public void setSuggestedUnitPrice(BigDecimal suggestedUnitPrice) { this.suggestedUnitPrice = suggestedUnitPrice; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
}