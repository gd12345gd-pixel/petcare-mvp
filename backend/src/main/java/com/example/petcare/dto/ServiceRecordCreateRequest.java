package com.example.petcare.dto;

import java.util.List;

public class ServiceRecordCreateRequest {

    private Long orderId;
    private Long scheduleId;
    private Long sitterId;
    private Long userId;

    private String petStatus;
    private List<String> completedItems;
    private String remark;
    private String arrivedAt;
    private List<String> imageUrls;

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public Long getScheduleId() { return scheduleId; }
    public void setScheduleId(Long scheduleId) { this.scheduleId = scheduleId; }

    public Long getSitterId() { return sitterId; }
    public void setSitterId(Long sitterId) { this.sitterId = sitterId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getPetStatus() { return petStatus; }
    public void setPetStatus(String petStatus) { this.petStatus = petStatus; }

    public List<String> getCompletedItems() { return completedItems; }
    public void setCompletedItems(List<String> completedItems) { this.completedItems = completedItems; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }

    public String getArrivedAt() { return arrivedAt; }
    public void setArrivedAt(String arrivedAt) { this.arrivedAt = arrivedAt; }

    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }
}