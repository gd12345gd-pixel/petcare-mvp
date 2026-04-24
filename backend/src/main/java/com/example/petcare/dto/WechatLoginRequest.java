package com.example.petcare.dto;

import lombok.Data;

@Data
public class WechatLoginRequest {
    private String code;
    private LoginDeviceInfo deviceInfo;
}
