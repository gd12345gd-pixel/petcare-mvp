package com.example.petcare.dto;

public class CompleteServiceRequest {

    private Long orderId;
    private Long sitterId;

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public Long getSitterId() { return sitterId; }
    public void setSitterId(Long sitterId) { this.sitterId = sitterId; }
}