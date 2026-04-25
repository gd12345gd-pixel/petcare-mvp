package com.example.petcare.controller;

import com.example.petcare.auth.AuthContext;
import com.example.petcare.common.ApiResponse;
import com.example.petcare.dto.SitterApplyRequest;
import com.example.petcare.dto.SitterProfileResponse;
import com.example.petcare.dto.SitterRuleResponse;
import com.example.petcare.service.SitterProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sitter")
@RequiredArgsConstructor
@CrossOrigin
public class SitterProfileController {

    private final SitterProfileService sitterProfileService;

    @GetMapping("/me")
    public ApiResponse<SitterProfileResponse> me() {
        return ApiResponse.success(sitterProfileService.getMe(AuthContext.requireCurrentUserId()));
    }

    @PostMapping("/apply")
    public ApiResponse<SitterProfileResponse> apply(@RequestBody SitterApplyRequest request) {
        return ApiResponse.success("提交审核成功", sitterProfileService.apply(AuthContext.requireCurrentUserId(), request));
    }

    @PutMapping("/apply")
    public ApiResponse<SitterProfileResponse> resubmit(@RequestBody SitterApplyRequest request) {
        return ApiResponse.success("重新提交成功", sitterProfileService.resubmit(AuthContext.requireCurrentUserId(), request));
    }

    @PostMapping("/deposit/pay")
    public ApiResponse<SitterProfileResponse> payDeposit() {
        return ApiResponse.success("押金缴纳成功", sitterProfileService.payDeposit(AuthContext.requireCurrentUserId()));
    }

    @PostMapping("/deposit/refund")
    public ApiResponse<SitterProfileResponse> refundDeposit() {
        return ApiResponse.success("退押金申请已提交", sitterProfileService.refundDeposit(AuthContext.requireCurrentUserId()));
    }

    @GetMapping("/rules")
    public ApiResponse<SitterRuleResponse> rules() {
        return ApiResponse.success(sitterProfileService.rules());
    }
}
