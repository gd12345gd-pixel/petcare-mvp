package com.example.petcare.dto;

import java.util.List;

public class OrderPetItemResponse {

    private Long petId;
    private String petName;
    private String petType;
    private String petBreed;
    private String petImageUrl;
    private String petGender;
    private String petAge;
    private String petRemark;
    private String petWeight;
    private List<String> petTags;
    private Integer hasAggression;
    private Integer vaccinated;
    private String petIntro;
    private List<String> petAlbumList;

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

    public String getPetWeight() {
        return petWeight;
    }

    public void setPetWeight(String petWeight) {
        this.petWeight = petWeight;
    }

    public List<String> getPetTags() {
        return petTags;
    }

    public void setPetTags(List<String> petTags) {
        this.petTags = petTags;
    }

    public Integer getHasAggression() {
        return hasAggression;
    }

    public void setHasAggression(Integer hasAggression) {
        this.hasAggression = hasAggression;
    }

    public Integer getVaccinated() {
        return vaccinated;
    }

    public void setVaccinated(Integer vaccinated) {
        this.vaccinated = vaccinated;
    }

    public String getPetIntro() {
        return petIntro;
    }

    public void setPetIntro(String petIntro) {
        this.petIntro = petIntro;
    }

    public List<String> getPetAlbumList() {
        return petAlbumList;
    }

    public void setPetAlbumList(List<String> petAlbumList) {
        this.petAlbumList = petAlbumList;
    }
}
