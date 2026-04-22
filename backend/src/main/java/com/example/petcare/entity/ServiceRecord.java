package com.example.petcare.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_record")
public class ServiceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "schedule_id")
    private Long scheduleId;

    @Column(name = "sitter_id", nullable = false)
    private Long sitterId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "record_status", nullable = false, length = 32)
    private String recordStatus;

    @Column(name = "pet_status", nullable = false, length = 32)
    private String petStatus;

    @Column(name = "completed_items_json", columnDefinition = "TEXT")
    private String completedItemsJson;

    @Column(length = 500)
    private String remark;

    @Column(name = "arrived_at")
    private LocalDateTime arrivedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public Long getId() { return id; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public Long getScheduleId() { return scheduleId; }
    public void setScheduleId(Long scheduleId) { this.scheduleId = scheduleId; }

    public Long getSitterId() { return sitterId; }
    public void setSitterId(Long sitterId) { this.sitterId = sitterId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getRecordStatus() { return recordStatus; }
    public void setRecordStatus(String recordStatus) { this.recordStatus = recordStatus; }

    public String getPetStatus() { return petStatus; }
    public void setPetStatus(String petStatus) { this.petStatus = petStatus; }

    public String getCompletedItemsJson() { return completedItemsJson; }
    public void setCompletedItemsJson(String completedItemsJson) { this.completedItemsJson = completedItemsJson; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }

    public LocalDateTime getArrivedAt() { return arrivedAt; }
    public void setArrivedAt(LocalDateTime arrivedAt) { this.arrivedAt = arrivedAt; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
}