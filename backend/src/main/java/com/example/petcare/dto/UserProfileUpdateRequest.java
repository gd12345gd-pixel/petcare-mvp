package com.example.petcare.dto;

import lombok.Data;

@Data
public class UserProfileUpdateRequest {
    private String nickname;
    private String avatarUrl;
    private String phone;
}
