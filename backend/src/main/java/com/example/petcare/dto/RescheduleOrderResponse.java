package com.example.petcare.dto;

import java.math.BigDecimal;

public class RescheduleOrderResponse {

    private Long oldOrderId;
    private Long newOrderId;
    private String newOrderNo;
    private BigDecimal oldTotalPrice;
    private BigDecimal newTotalPrice;
    private BigDecimal priceDiff;
    private String priceChangeType;
    private String paymentAction;
    private Integer rescheduleCount;
    private Integer maxRescheduleCount;

    public Long getOldOrderId() { return oldOrderId; }
    public void setOldOrderId(Long oldOrderId) { this.oldOrderId = oldOrderId; }

    public Long getNewOrderId() { return newOrderId; }
    public void setNewOrderId(Long newOrderId) { this.newOrderId = newOrderId; }

    public String getNewOrderNo() { return newOrderNo; }
    public void setNewOrderNo(String newOrderNo) { this.newOrderNo = newOrderNo; }

    public BigDecimal getOldTotalPrice() { return oldTotalPrice; }
    public void setOldTotalPrice(BigDecimal oldTotalPrice) { this.oldTotalPrice = oldTotalPrice; }

    public BigDecimal getNewTotalPrice() { return newTotalPrice; }
    public void setNewTotalPrice(BigDecimal newTotalPrice) { this.newTotalPrice = newTotalPrice; }

    public BigDecimal getPriceDiff() { return priceDiff; }
    public void setPriceDiff(BigDecimal priceDiff) { this.priceDiff = priceDiff; }

    public String getPriceChangeType() { return priceChangeType; }
    public void setPriceChangeType(String priceChangeType) { this.priceChangeType = priceChangeType; }

    public String getPaymentAction() { return paymentAction; }
    public void setPaymentAction(String paymentAction) { this.paymentAction = paymentAction; }

    public Integer getRescheduleCount() { return rescheduleCount; }
    public void setRescheduleCount(Integer rescheduleCount) { this.rescheduleCount = rescheduleCount; }

    public Integer getMaxRescheduleCount() { return maxRescheduleCount; }
    public void setMaxRescheduleCount(Integer maxRescheduleCount) { this.maxRescheduleCount = maxRescheduleCount; }
}
