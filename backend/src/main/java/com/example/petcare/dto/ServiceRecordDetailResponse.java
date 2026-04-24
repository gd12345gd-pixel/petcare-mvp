package com.example.petcare.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class ServiceRecordDetailResponse {

    private Long id;
    private Long orderId;
    private Long scheduleId;
    private Long sitterId;

    private String orderNo;
    private String orderStatus;
    private String payStatus;
    private String serviceContactName;
    private String serviceContactPhone;
    private String serviceFullAddress;
    private BigDecimal serviceLatitude;
    private BigDecimal serviceLongitude;
    private Integer petCount;
    private Integer serviceDateCount;
    private String orderRemark;
    private String specialRequirement;

    private String remark;
    private String abnormalDesc;
    private LocalDateTime submittedAt;

    private LocalDate serviceDate;
    private List<String> timeSlots;
    private Integer serviceDurationMinutes;
    private String scheduleStatus;
    private LocalDateTime startTime;
    private LocalDateTime finishTime;
    private BigDecimal startLatitude;
    private BigDecimal startLongitude;
    private BigDecimal finishLatitude;
    private BigDecimal finishLongitude;
    private Integer startDistanceMeters;
    private Integer finishDistanceMeters;
    private String startLocationText;
    private String finishLocationText;
    private Integer actualServiceDurationMinutes;

    private List<String> serviceItems;
    private List<String> petObservations;
    private List<String> images;
    private List<String> videos;
    private List<OrderPetItemResponse> pets;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(Long scheduleId) {
        this.scheduleId = scheduleId;
    }

    public Long getSitterId() {
        return sitterId;
    }

    public void setSitterId(Long sitterId) {
        this.sitterId = sitterId;
    }

    public String getOrderNo() {
        return orderNo;
    }

    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }

    public String getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(String orderStatus) {
        this.orderStatus = orderStatus;
    }

    public String getPayStatus() {
        return payStatus;
    }

    public void setPayStatus(String payStatus) {
        this.payStatus = payStatus;
    }

    public String getServiceContactName() {
        return serviceContactName;
    }

    public void setServiceContactName(String serviceContactName) {
        this.serviceContactName = serviceContactName;
    }

    public String getServiceContactPhone() {
        return serviceContactPhone;
    }

    public void setServiceContactPhone(String serviceContactPhone) {
        this.serviceContactPhone = serviceContactPhone;
    }

    public String getServiceFullAddress() {
        return serviceFullAddress;
    }

    public void setServiceFullAddress(String serviceFullAddress) {
        this.serviceFullAddress = serviceFullAddress;
    }

    public BigDecimal getServiceLatitude() {
        return serviceLatitude;
    }

    public void setServiceLatitude(BigDecimal serviceLatitude) {
        this.serviceLatitude = serviceLatitude;
    }

    public BigDecimal getServiceLongitude() {
        return serviceLongitude;
    }

    public void setServiceLongitude(BigDecimal serviceLongitude) {
        this.serviceLongitude = serviceLongitude;
    }

    public Integer getPetCount() {
        return petCount;
    }

    public void setPetCount(Integer petCount) {
        this.petCount = petCount;
    }

    public Integer getServiceDateCount() {
        return serviceDateCount;
    }

    public void setServiceDateCount(Integer serviceDateCount) {
        this.serviceDateCount = serviceDateCount;
    }

    public String getOrderRemark() {
        return orderRemark;
    }

    public void setOrderRemark(String orderRemark) {
        this.orderRemark = orderRemark;
    }

    public String getSpecialRequirement() {
        return specialRequirement;
    }

    public void setSpecialRequirement(String specialRequirement) {
        this.specialRequirement = specialRequirement;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public String getAbnormalDesc() {
        return abnormalDesc;
    }

    public void setAbnormalDesc(String abnormalDesc) {
        this.abnormalDesc = abnormalDesc;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public LocalDate getServiceDate() {
        return serviceDate;
    }

    public void setServiceDate(LocalDate serviceDate) {
        this.serviceDate = serviceDate;
    }

    public List<String> getTimeSlots() {
        return timeSlots;
    }

    public void setTimeSlots(List<String> timeSlots) {
        this.timeSlots = timeSlots;
    }

    public Integer getServiceDurationMinutes() {
        return serviceDurationMinutes;
    }

    public void setServiceDurationMinutes(Integer serviceDurationMinutes) {
        this.serviceDurationMinutes = serviceDurationMinutes;
    }

    public String getScheduleStatus() {
        return scheduleStatus;
    }

    public void setScheduleStatus(String scheduleStatus) {
        this.scheduleStatus = scheduleStatus;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getFinishTime() {
        return finishTime;
    }

    public void setFinishTime(LocalDateTime finishTime) {
        this.finishTime = finishTime;
    }

    public BigDecimal getStartLatitude() {
        return startLatitude;
    }

    public void setStartLatitude(BigDecimal startLatitude) {
        this.startLatitude = startLatitude;
    }

    public BigDecimal getStartLongitude() {
        return startLongitude;
    }

    public void setStartLongitude(BigDecimal startLongitude) {
        this.startLongitude = startLongitude;
    }

    public BigDecimal getFinishLatitude() {
        return finishLatitude;
    }

    public void setFinishLatitude(BigDecimal finishLatitude) {
        this.finishLatitude = finishLatitude;
    }

    public BigDecimal getFinishLongitude() {
        return finishLongitude;
    }

    public void setFinishLongitude(BigDecimal finishLongitude) {
        this.finishLongitude = finishLongitude;
    }

    public Integer getStartDistanceMeters() {
        return startDistanceMeters;
    }

    public void setStartDistanceMeters(Integer startDistanceMeters) {
        this.startDistanceMeters = startDistanceMeters;
    }

    public Integer getFinishDistanceMeters() {
        return finishDistanceMeters;
    }

    public void setFinishDistanceMeters(Integer finishDistanceMeters) {
        this.finishDistanceMeters = finishDistanceMeters;
    }

    public String getStartLocationText() {
        return startLocationText;
    }

    public void setStartLocationText(String startLocationText) {
        this.startLocationText = startLocationText;
    }

    public String getFinishLocationText() {
        return finishLocationText;
    }

    public void setFinishLocationText(String finishLocationText) {
        this.finishLocationText = finishLocationText;
    }

    public Integer getActualServiceDurationMinutes() {
        return actualServiceDurationMinutes;
    }

    public void setActualServiceDurationMinutes(Integer actualServiceDurationMinutes) {
        this.actualServiceDurationMinutes = actualServiceDurationMinutes;
    }

    public List<String> getServiceItems() {
        return serviceItems;
    }

    public void setServiceItems(List<String> serviceItems) {
        this.serviceItems = serviceItems;
    }

    public List<String> getPetObservations() {
        return petObservations;
    }

    public void setPetObservations(List<String> petObservations) {
        this.petObservations = petObservations;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public List<String> getVideos() {
        return videos;
    }

    public void setVideos(List<String> videos) {
        this.videos = videos;
    }

    public List<OrderPetItemResponse> getPets() {
        return pets;
    }

    public void setPets(List<OrderPetItemResponse> pets) {
        this.pets = pets;
    }
}
