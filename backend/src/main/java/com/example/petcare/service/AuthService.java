package com.example.petcare.service;

import com.example.petcare.dto.*;
import com.example.petcare.auth.TokenService;
import com.example.petcare.entity.User;
import com.example.petcare.entity.UserLoginLog;
import com.example.petcare.repository.UserLoginLogRepository;
import com.example.petcare.repository.UserRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Service
public class AuthService {

    @Value("${wechat.miniapp.appid}")
    private String appid;

    @Value("${wechat.miniapp.secret}")
    private String secret;

    private final UserRepository userRepository;
    private final UserLoginLogRepository userLoginLogRepository;
    private final TokenService tokenService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public AuthService(UserRepository userRepository,
                       UserLoginLogRepository userLoginLogRepository,
                       TokenService tokenService) {
        this.userRepository = userRepository;
        this.userLoginLogRepository = userLoginLogRepository;
        this.tokenService = tokenService;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }


    public WechatLoginResponse wechatLogin(WechatLoginRequest request, HttpServletRequest servletRequest) {
        String code = request == null ? null : request.getCode();
        if (code == null || code.isBlank()) {
            throw new RuntimeException("code不能为空");
        }

        String url = "https://api.weixin.qq.com/sns/jscode2session"
                + "?appid=" + URLEncoder.encode(appid, StandardCharsets.UTF_8)
                + "&secret=" + URLEncoder.encode(secret, StandardCharsets.UTF_8)
                + "&js_code=" + URLEncoder.encode(code, StandardCharsets.UTF_8)
                + "&grant_type=authorization_code";

        String rawResponse;
        try {
            rawResponse = restTemplate.getForObject(url, String.class);
        } catch (Exception e) {
            throw new RuntimeException("微信登录失败：请求微信服务器异常：" + e.getMessage(), e);
        }

        if (rawResponse == null || rawResponse.isBlank()) {
            throw new RuntimeException("微信登录失败：微信接口无响应");
        }

        WechatCode2SessionResponse response;
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            response = objectMapper.readValue(rawResponse, WechatCode2SessionResponse.class);
        } catch (Exception e) {
            throw new RuntimeException("微信登录失败：解析微信返回失败，原始返回：" + rawResponse, e);
        }

        if (response.getErrcode() != null && response.getErrcode() != 0) {
            throw new RuntimeException(
                    "微信登录失败：errcode=" + response.getErrcode()
                            + "，errmsg=" + response.getErrmsg()
                            + "，raw=" + rawResponse
            );
        }

        if (response.getOpenid() == null || response.getOpenid().isBlank()) {
            throw new RuntimeException("微信登录失败：openid为空，原始返回：" + rawResponse);
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

        // 尽可能保留微信登录信息
        user.setOpenid(response.getOpenid());
        user.setUnionid(response.getUnionid());
        user.setSessionKey(response.getSessionKey());
        user.setWxLoginRaw(rawResponse);
        user.setUpdatedAt(LocalDateTime.now());
        user.setLastLoginAt(LocalDateTime.now());
        user.setLastLoginIp(resolveClientIp(servletRequest));
        user.setLastLoginUserAgent(resolveUserAgent(servletRequest));

        User saved = userRepository.save(user);
        saveLoginLog(saved, request.getDeviceInfo(), servletRequest);

        String token = tokenService.generateToken(saved);

        UserLoginVO vo = toUserLoginVO(saved);

        return new WechatLoginResponse(token, vo);
    }

    public UserLoginVO updateProfile(Long userId, UserProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        if (request.getNickname() != null) {
            user.setNickname(request.getNickname().trim());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }
        user.setUpdatedAt(LocalDateTime.now());
        return toUserLoginVO(userRepository.save(user));
    }

    private UserLoginVO toUserLoginVO(User user) {
        return UserLoginVO.builder()
                .id(user.getId())
                .openid(user.getOpenid())
                .nickname(user.getNickname())
                .avatarUrl(user.getAvatarUrl())
                .phone(user.getPhone())
                .role(user.getRole())
                .sitterStatus(user.getSitterStatus())
                .currentRole("USER")
                .profileCompleted(isProfileCompleted(user))
                .build();
    }

    private boolean isProfileCompleted(User user) {
        return user.getNickname() != null
                && !user.getNickname().isBlank()
                && !"微信用户".equals(user.getNickname());
    }

    private void saveLoginLog(User user, LoginDeviceInfo deviceInfo, HttpServletRequest request) {
        UserLoginLog log = new UserLoginLog();
        log.setUserId(user.getId());
        log.setOpenid(user.getOpenid());
        log.setLoginType("WECHAT_MINIAPP");
        log.setIpAddress(resolveClientIp(request));
        log.setUserAgent(resolveUserAgent(request));
        if (deviceInfo != null) {
            log.setDeviceBrand(deviceInfo.getBrand());
            log.setDeviceModel(deviceInfo.getModel());
            log.setSystemInfo(deviceInfo.getSystem());
            log.setPlatform(deviceInfo.getPlatform());
            log.setSdkVersion(deviceInfo.getSdkVersion());
            log.setAppVersion(deviceInfo.getAppVersion());
            log.setRawDeviceInfo(deviceInfo.getRawDeviceInfo());
        }
        log.setCreatedAt(LocalDateTime.now());
        userLoginLogRepository.save(log);
    }

    private String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return "";
        }
        String[] headers = {"X-Forwarded-For", "X-Real-IP", "Proxy-Client-IP", "WL-Proxy-Client-IP"};
        for (String header : headers) {
            String value = request.getHeader(header);
            if (value != null && !value.isBlank() && !"unknown".equalsIgnoreCase(value)) {
                return value.split(",")[0].trim();
            }
        }
        return request.getRemoteAddr();
    }

    private String resolveUserAgent(HttpServletRequest request) {
        if (request == null) {
            return "";
        }
        String userAgent = request.getHeader("User-Agent");
        return userAgent == null ? "" : userAgent;
    }
}
