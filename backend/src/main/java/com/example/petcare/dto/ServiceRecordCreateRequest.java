package com.example.petcare.dto;

import java.util.List;

public class ServiceRecordCreateRequest {

    private Long orderId;
    private Long scheduleId;
    private Long sitterId;

    private List<String> serviceItems;
    private List<String> petObservations;

    private String abnormalDesc;
    private List<String> images;
    private List<String> videos;
    private String remark;

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

    public String getAbnormalDesc() {
        return abnormalDesc;
    }

    public void setAbnormalDesc(String abnormalDesc) {
        this.abnormalDesc = abnormalDesc;
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

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }
}