package com.example.petcare.controller;

import com.example.petcare.common.Result;
import com.example.petcare.dto.WechatLoginRequest;
import com.example.petcare.dto.WechatLoginResponse;
import com.example.petcare.service.AuthService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/wechat-login")
    public Result<WechatLoginResponse> wechatLogin(@RequestBody WechatLoginRequest request) {
        return Result.success(authService.wechatLogin(request.getCode()));
    }
}