package com.example.petcare.controller;

import com.example.petcare.common.ApiResponse;
import com.example.petcare.dto.*;
import com.example.petcare.service.OrderService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/createOrder")
    public ApiResponse<CreateOrderResponse> createOrder(@RequestBody CreateOrderRequest request) {
        return ApiResponse.success("下单成功", orderService.createOrder(request));
    }

    @GetMapping("/detail")
    public ApiResponse<OrderDetailResponse> detail(@RequestParam Long id, @RequestParam Long userId) {
        return ApiResponse.success(orderService.detail(id, userId));
    }

    @PostMapping("/cancel")
    public ApiResponse<Void> cancel(@RequestBody CancelOrderRequest request) {
        orderService.cancelOrder(request);
        return ApiResponse.success("取消订单成功", null);
    }

    @GetMapping("/list")
    public ApiResponse<List<OrderListItemResponse>> list(@RequestParam Long userId) {
        return ApiResponse.success(orderService.list(userId));
    }
}