package com.example.petcare.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "user_login_log")
public class UserLoginLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private String openid;

    private String loginType;

    private String ipAddress;

    @Column(length = 512)
    private String userAgent;

    private String deviceBrand;

    private String deviceModel;

    private String systemInfo;

    private String platform;

    private String sdkVersion;

    private String appVersion;

    @Column(length = 512)
    private String rawDeviceInfo;

    private LocalDateTime createdAt;
}
