package com.example.petcare.dto;

public class OrderPetItemResponse {

    private Long petId;
    private String petName;
    private String petType;
    private String petBreed;
    private String petImageUrl;
    private String petGender;
    private String petAge;
    private String petRemark;

    public Long getPetId() {
        return petId;
    }

    public void setPetId(Long petId) {
        this.petId = petId;
    }

    public String getPetName() {
        return petName;
    }

    public void setPetName(String petName) {
        this.petName = petName;
    }

    public String getPetType() {
        return petType;
    }

    public void setPetType(String petType) {
        this.petType = petType;
    }

    public String getPetBreed() {
        return petBreed;
    }

    public void setPetBreed(String petBreed) {
        this.petBreed = petBreed;
    }

    public String getPetImageUrl() {
        return petImageUrl;
    }

    public void setPetImageUrl(String petImageUrl) {
        this.petImageUrl = petImageUrl;
    }

    public String getPetGender() {
        return petGender;
    }

    public void setPetGender(String petGender) {
        this.petGender = petGender;
    }

    public String getPetAge() {
        return petAge;
    }

    public void setPetAge(String petAge) {
        this.petAge = petAge;
    }

    public String getPetRemark() {
        return petRemark;
    }

    public void setPetRemark(String petRemark) {
        this.petRemark = petRemark;
    }
}