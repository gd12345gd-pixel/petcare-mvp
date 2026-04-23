package com.example.petcare.controller;

import com.example.petcare.common.ApiResponse;
import com.example.petcare.dto.*;
import com.example.petcare.service.SitterOrderService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sitter/orders")
@CrossOrigin
public class SitterOrderController {

    private final SitterOrderService sitterOrderService;

    public SitterOrderController(SitterOrderService sitterOrderService) {
        this.sitterOrderService = sitterOrderService;
    }

    @PostMapping("/available")
    public ApiResponse<List<SitterAvailableOrderItemResponse>> available(@RequestBody SitterOrderListRequest request) {
        return ApiResponse.success(sitterOrderService.availableOrders(request));
    }

    @PostMapping("/mine")
    public ApiResponse<List<SitterMyOrderItemResponse>> mine(@RequestBody SitterOrderListRequest request) {
        return ApiResponse.success(sitterOrderService.myOrders(request));
    }

    @GetMapping("/detail")
    public ApiResponse<SitterOrderDetailResponse> detail(@RequestParam Long id, @RequestParam Long sitterId) {
        return ApiResponse.success(sitterOrderService.detail(id, sitterId));
    }

    @PostMapping("/take")
    public ApiResponse<Void> take(@RequestBody TakeOrderRequest request) {
        sitterOrderService.takeOrder(request);
        return ApiResponse.success("接单成功", null);
    }

    @PostMapping("/start-service")
    public ApiResponse<Void> startService(@RequestBody StartServiceRequest request) {
        sitterOrderService.startService(request);
        return ApiResponse.success("开始服务成功", null);
    }

    @PostMapping("/complete-service")
    public ApiResponse<Void> completeService(@RequestBody CompleteServiceRequest request) {
        sitterOrderService.completeService(request);
        return ApiResponse.success("完成服务成功", null);
    }

    @PostMapping("/start-schedule")
    public ApiResponse<Void> startSchedule(@RequestBody StartScheduleRequest request) {
        sitterOrderService.startSchedule(request);
        return ApiResponse.success("开始本次服务成功", null);
    }

    @PostMapping("/finish-schedule")
    public ApiResponse<Void> finishSchedule(@RequestBody FinishScheduleRequest request) {
        sitterOrderService.finishSchedule(request);
        return ApiResponse.success("完成本次服务成功", null);
    }



}