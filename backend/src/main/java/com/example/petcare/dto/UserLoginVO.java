package com.example.petcare.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserLoginVO {
    private Long id;
    private String openid;
    private String nickname;
    private String avatarUrl;
    private String role;
    private String sitterStatus;
    private String currentRole;
}