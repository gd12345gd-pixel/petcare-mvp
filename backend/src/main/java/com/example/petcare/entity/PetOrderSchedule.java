package com.example.petcare.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "pet_order_schedule")
public class PetOrderSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "service_date", nullable = false)
    private LocalDate serviceDate;

    @Column(name = "time_slots_json", columnDefinition = "json")
    private String timeSlotsJson;

    @Column(name = "service_duration_minutes", nullable = false)
    private Integer serviceDurationMinutes = 0;

    @Column(name = "schedule_status", nullable = false, length = 32)
    private String scheduleStatus = "PENDING";

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public Long getId() { return id; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public LocalDate getServiceDate() { return serviceDate; }
    public void setServiceDate(LocalDate serviceDate) { this.serviceDate = serviceDate; }

    public String getTimeSlotsJson() { return timeSlotsJson; }
    public void setTimeSlotsJson(String timeSlotsJson) { this.timeSlotsJson = timeSlotsJson; }

    public Integer getServiceDurationMinutes() { return serviceDurationMinutes; }
    public void setServiceDurationMinutes(Integer serviceDurationMinutes) { this.serviceDurationMinutes = serviceDurationMinutes; }

    public String getScheduleStatus() { return scheduleStatus; }
    public void setScheduleStatus(String scheduleStatus) { this.scheduleStatus = scheduleStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}