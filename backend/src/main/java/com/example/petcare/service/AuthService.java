package com.example.petcare.service;

import com.example.petcare.dto.*;
import com.example.petcare.entity.User;
import com.example.petcare.repository.UserRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class   AuthService {

    @Value("${wechat.miniapp.appid}")
    private String appid;

    @Value("${wechat.miniapp.secret}")
    private String secret;

    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }


    public WechatLoginResponse wechatLogin(String code) {
        if (code == null || code.isBlank()) {
            throw new RuntimeException("code不能为空");
        }

        String url = "https://api.weixin.qq.com/sns/jscode2session"
            + "?appid=" + URLEncoder.encode(appid, StandardCharsets.UTF_8)
            + "&secret=" + URLEncoder.encode(secret, StandardCharsets.UTF_8)
            + "&js_code=" + URLEncoder.encode(code, StandardCharsets.UTF_8)
            + "&grant_type=authorization_code";

        WechatCode2SessionResponse response = restTemplate.getForObject(url, WechatCode2SessionResponse.class);

        if (response == null) {
            throw new RuntimeException("微信登录失败：无响应");
        }
        if (response.getErrcode() != null && response.getErrcode() != 0) {
            throw new RuntimeException("微信登录失败：" + response.getErrmsg());
        }
        if (response.getOpenid() == null || response.getOpenid().isBlank()) {
            throw new RuntimeException("微信登录失败：openid为空");
        }

        User user = userRepository.findByOpenid(response.getOpenid())
            .orElseGet(() -> {
                User u = new User();
                u.setOpenid(response.getOpenid());
                u.setUnionid(response.getUnionid());
                u.setNickname("微信用户");
                u.setAvatarUrl("");
                u.setRole("USER");
                u.setCreatedAt(LocalDateTime.now());
                return u;
            });

        user.setUnionid(response.getUnionid());
        user.setUpdatedAt(LocalDateTime.now());
        user.setLastLoginAt(LocalDateTime.now());

        User saved = userRepository.save(user);

        String token = generateSimpleToken(saved);

        UserLoginVO vo = UserLoginVO.builder()
            .id(saved.getId())
            .openid(saved.getOpenid())
            .nickname(saved.getNickname())
            .avatarUrl(saved.getAvatarUrl())
            .role(saved.getRole())
            .sitterStatus(saved.getSitterStatus())
            .currentRole("USER")
            .build();

        return new WechatLoginResponse(token, vo);
    }

    private String generateSimpleToken(User user) {
        String raw = user.getId() + ":" + user.getOpenid() + ":" + System.currentTimeMillis();
        return Base64.getEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }
}