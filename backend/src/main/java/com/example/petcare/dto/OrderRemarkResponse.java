package com.example.petcare.dto;

import java.time.LocalDateTime;
import java.util.List;

public class OrderRemarkResponse {

    private Long id;
    private Long orderId;
    private String remarkType;
    private String submitterType;
    private Long userId;
    private String content;
    private List<String> imageUrls;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public String getRemarkType() { return remarkType; }
    public void setRemarkType(String remarkType) { this.remarkType = remarkType; }

    public String getSubmitterType() { return submitterType; }
    public void setSubmitterType(String submitterType) { this.submitterType = submitterType; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
