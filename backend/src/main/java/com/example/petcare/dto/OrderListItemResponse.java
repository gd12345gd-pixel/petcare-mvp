package com.example.petcare.dto;

import java.math.BigDecimal;
import java.util.List;

public class OrderListItemResponse {

    private Long id;
    private String orderNo;
    private String orderStatus;
    private String payStatus;

    private Integer petCount;
    private Integer catCount;
    private Integer dogCount;
    private Integer serviceDateCount;
    private Integer completedServiceCount;
    private Integer serviceDurationMinutes;

    private String serviceContactName;
    private String serviceContactPhone;
    private String serviceFullAddress;

    private BigDecimal unitPrice;
    private BigDecimal totalPrice;

    private String firstServiceDate;
    private String lastServiceDate;
    /** 全部上门日期 yyyy-MM-dd，用于前端「今日服务」等筛选 */
    private List<String> serviceDates;
    /** 今日若有上门：待托托师上门 / 今日服务中 / 今日已完成；无则空串 */
    private String todayServiceLabel;
    /** 最近待完成上门的日期 yyyy-MM-dd（严格晚于今天；仅今日待上门时为空） */
    private String nextPendingServiceDate;
    private String createdAt;
    private Boolean canReschedule;
    private String rescheduleHint;
    private Boolean canReview;
    private Boolean reviewed;
    /** 列表卡片头像：订单关联宠物首张可用图（下单快照 pet_image_url 或宠物档案 avatar） */
    private String petImageUrl;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }

    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }

    public String getPayStatus() { return payStatus; }
    public void setPayStatus(String payStatus) { this.payStatus = payStatus; }

    public Integer getPetCount() { return petCount; }
    public void setPetCount(Integer petCount) { this.petCount = petCount; }

    public Integer getCatCount() { return catCount; }
    public void setCatCount(Integer catCount) { this.catCount = catCount; }

    public Integer getDogCount() { return dogCount; }
    public void setDogCount(Integer dogCount) { this.dogCount = dogCount; }

    public Integer getServiceDateCount() { return serviceDateCount; }
    public void setServiceDateCount(Integer serviceDateCount) { this.serviceDateCount = serviceDateCount; }

    public Integer getCompletedServiceCount() { return completedServiceCount; }
    public void setCompletedServiceCount(Integer completedServiceCount) { this.completedServiceCount = completedServiceCount; }

    public Integer getServiceDurationMinutes() { return serviceDurationMinutes; }
    public void setServiceDurationMinutes(Integer serviceDurationMinutes) { this.serviceDurationMinutes = serviceDurationMinutes; }

    public String getServiceContactName() { return serviceContactName; }
    public void setServiceContactName(String serviceContactName) { this.serviceContactName = serviceContactName; }

    public String getServiceContactPhone() { return serviceContactPhone; }
    public void setServiceContactPhone(String serviceContactPhone) { this.serviceContactPhone = serviceContactPhone; }

    public String getServiceFullAddress() { return serviceFullAddress; }
    public void setServiceFullAddress(String serviceFullAddress) { this.serviceFullAddress = serviceFullAddress; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }

    public String getFirstServiceDate() { return firstServiceDate; }
    public void setFirstServiceDate(String firstServiceDate) { this.firstServiceDate = firstServiceDate; }

    public String getLastServiceDate() { return lastServiceDate; }
    public void setLastServiceDate(String lastServiceDate) { this.lastServiceDate = lastServiceDate; }

    public List<String> getServiceDates() { return serviceDates; }
    public void setServiceDates(List<String> serviceDates) { this.serviceDates = serviceDates; }

    public String getTodayServiceLabel() { return todayServiceLabel; }
    public void setTodayServiceLabel(String todayServiceLabel) { this.todayServiceLabel = todayServiceLabel; }

    public String getNextPendingServiceDate() { return nextPendingServiceDate; }
    public void setNextPendingServiceDate(String nextPendingServiceDate) { this.nextPendingServiceDate = nextPendingServiceDate; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public Boolean getCanReschedule() { return canReschedule; }
    public void setCanReschedule(Boolean canReschedule) { this.canReschedule = canReschedule; }

    public String getRescheduleHint() { return rescheduleHint; }
    public void setRescheduleHint(String rescheduleHint) { this.rescheduleHint = rescheduleHint; }

    public Boolean getCanReview() { return canReview; }
    public void setCanReview(Boolean canReview) { this.canReview = canReview; }

    public Boolean getReviewed() { return reviewed; }
    public void setReviewed(Boolean reviewed) { this.reviewed = reviewed; }

    public String getPetImageUrl() { return petImageUrl; }
    public void setPetImageUrl(String petImageUrl) { this.petImageUrl = petImageUrl; }
}