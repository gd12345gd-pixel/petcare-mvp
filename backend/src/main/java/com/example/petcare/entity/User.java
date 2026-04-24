package com.example.petcare.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String openid;

    private String unionid;

    private String sessionKey;

    private String nickname;

    private String avatarUrl;

    private String phone;

    private String role;

    private String sitterStatus;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime lastLoginAt;

    private String lastLoginIp;

    @Column(length = 512)
    private String lastLoginUserAgent;

    @Column(length = 2048)
    private String wxLoginRaw;
}
