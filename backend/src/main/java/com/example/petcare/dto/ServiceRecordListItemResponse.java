package com.example.petcare.dto;

public class ServiceRecordListItemResponse {

    private Long id;
    private Long orderId;
    private Long scheduleId;
    private String petStatus;
    private String recordStatus;
    private String submittedAt;
    private Integer imageCount;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public Long getScheduleId() { return scheduleId; }
    public void setScheduleId(Long scheduleId) { this.scheduleId = scheduleId; }

    public String getPetStatus() { return petStatus; }
    public void setPetStatus(String petStatus) { this.petStatus = petStatus; }

    public String getRecordStatus() { return recordStatus; }
    public void setRecordStatus(String recordStatus) { this.recordStatus = recordStatus; }

    public String getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(String submittedAt) { this.submittedAt = submittedAt; }

    public Integer getImageCount() { return imageCount; }
    public void setImageCount(Integer imageCount) { this.imageCount = imageCount; }
}