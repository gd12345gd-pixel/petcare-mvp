package com.example.petcare.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class WechatLoginResponse {
    private String token;
    private UserLoginVO user;
}