package com.example.petcare.controller;

import com.example.petcare.auth.AuthContext;
import com.example.petcare.common.ApiResponse;
import com.example.petcare.dto.*;
import com.example.petcare.entity.SitterProfile;
import com.example.petcare.repository.SitterProfileRepository;
import com.example.petcare.service.SitterOrderService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sitter/orders")
@CrossOrigin
public class SitterOrderController {

    private final SitterOrderService sitterOrderService;
    private final SitterProfileRepository sitterProfileRepository;

    public SitterOrderController(SitterOrderService sitterOrderService, SitterProfileRepository sitterProfileRepository) {
        this.sitterOrderService = sitterOrderService;
        this.sitterProfileRepository = sitterProfileRepository;
    }

    @PostMapping("/available")
    public ApiResponse<List<SitterAvailableOrderItemResponse>> available(@RequestBody SitterOrderListRequest request) {
        request.setSitterId(currentSitterProfile().getId());
        return ApiResponse.success(sitterOrderService.availableOrders(request));
    }

    @PostMapping("/mine")
    public ApiResponse<List<SitterMyOrderItemResponse>> mine(@RequestBody SitterOrderListRequest request) {
        request.setSitterId(currentSitterProfile().getId());
        return ApiResponse.success(sitterOrderService.myOrders(request));
    }

    @GetMapping("/detail")
    public ApiResponse<SitterOrderDetailResponse> detail(@RequestParam Long id) {
        return ApiResponse.success(sitterOrderService.detail(id, currentSitterProfile().getId()));
    }

    @PostMapping("/take")
    public ApiResponse<Void> take(@RequestBody TakeOrderRequest request) {
        request.setSitterId(currentSitterProfile().getId());
        sitterOrderService.takeOrder(request);
        return ApiResponse.success("接单成功", null);
    }

    @PostMapping("/start-service")
    public ApiResponse<Void> startService(@RequestBody StartServiceRequest request) {
        request.setSitterId(currentSitterProfile().getId());
        sitterOrderService.startService(request);
        return ApiResponse.success("开始服务成功", null);
    }

    @PostMapping("/complete-service")
    public ApiResponse<Void> completeService(@RequestBody CompleteServiceRequest request) {
        request.setSitterId(currentSitterProfile().getId());
        sitterOrderService.completeService(request);
        return ApiResponse.success("完成服务成功", null);
    }

    @PostMapping("/start-schedule")
    public ApiResponse<Void> startSchedule(@RequestBody StartScheduleRequest request) {
        request.setSitterId(currentSitterProfile().getId());
        sitterOrderService.startSchedule(request);
        return ApiResponse.success("开始本次服务成功", null);
    }

    @PostMapping("/finish-schedule")
    public ApiResponse<Void> finishSchedule(@RequestBody FinishScheduleRequest request) {
        request.setSitterId(currentSitterProfile().getId());
        sitterOrderService.finishSchedule(request);
        return ApiResponse.success("完成本次服务成功", null);
    }

    private SitterProfile currentSitterProfile() {
        Long userId = AuthContext.requireCurrentUserId();
        return sitterProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("请先注册成为接单师"));
    }
}