package com.example.petcare.dto;

import lombok.Data;

@Data
public class LoginDeviceInfo {
    private String brand;
    private String model;
    private String system;
    private String platform;
    private String sdkVersion;
    private String appVersion;
    private String rawDeviceInfo;
}
