package com.example.petcare.dto;

import lombok.Data;

@Data
public class SitterApplyRequest {

    private String realName;
    private String phone;
    private String gender;
    private Integer age;
    private String city;
    private String serviceArea;
    private String petTypes;
    private String experience;
    private Boolean hasPetExperience;
    private String availableTimes;
    private String introduction;
    private String idCardNo;
    private String idCardFrontUrl;
    private String idCardBackUrl;
    private String certificateUrl;
}
