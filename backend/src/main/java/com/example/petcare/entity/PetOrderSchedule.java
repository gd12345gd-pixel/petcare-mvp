package com.example.petcare.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
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

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "finish_time")
    private LocalDateTime finishTime;

    @Column(name = "start_latitude", precision = 10, scale = 7)
    private BigDecimal startLatitude;

    @Column(name = "start_longitude", precision = 10, scale = 7)
    private BigDecimal startLongitude;

    @Column(name = "finish_latitude", precision = 10, scale = 7)
    private BigDecimal finishLatitude;

    @Column(name = "finish_longitude", precision = 10, scale = 7)
    private BigDecimal finishLongitude;

    @Column(name = "start_distance_meters")
    private Integer startDistanceMeters;

    @Column(name = "finish_distance_meters")
    private Integer finishDistanceMeters;

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