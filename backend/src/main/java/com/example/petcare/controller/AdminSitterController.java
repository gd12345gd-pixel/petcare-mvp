package com.example.petcare.controller;

import com.example.petcare.auth.AuthContext;
import com.example.petcare.common.ApiResponse;
import com.example.petcare.dto.SitterAuditRequest;
import com.example.petcare.dto.SitterProfileResponse;
import com.example.petcare.service.SitterProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/sitters")
@RequiredArgsConstructor
@CrossOrigin
public class AdminSitterController {

    private final SitterProfileService sitterProfileService;

    @GetMapping
    public ApiResponse<List<SitterProfileResponse>> list(@RequestParam(required = false) String auditStatus) {
        Long currentUserId = AuthContext.requireCurrentUserId();
        sitterProfileService.requireAdmin(currentUserId);
        return ApiResponse.success(sitterProfileService.listForAdmin(auditStatus));
    }

    @GetMapping("/{id}")
    public ApiResponse<SitterProfileResponse> detail(@PathVariable Long id) {
        Long currentUserId = AuthContext.requireCurrentUserId();
        sitterProfileService.requireAdmin(currentUserId);
        return ApiResponse.success(sitterProfileService.getForAdmin(id));
    }

    @PostMapping("/{id}/approve")
    public ApiResponse<SitterProfileResponse> approve(@PathVariable Long id) {
        Long currentUserId = AuthContext.requireCurrentUserId();
        sitterProfileService.requireAdmin(currentUserId);
        return ApiResponse.success("审核已通过", sitterProfileService.approve(id, currentUserId));
    }

    @PostMapping("/{id}/reject")
    public ApiResponse<SitterProfileResponse> reject(@PathVariable Long id, @RequestBody SitterAuditRequest request) {
        Long currentUserId = AuthContext.requireCurrentUserId();
        sitterProfileService.requireAdmin(currentUserId);
        return ApiResponse.success("审核已拒绝", sitterProfileService.reject(id, currentUserId, request.getRejectReason()));
    }
}
