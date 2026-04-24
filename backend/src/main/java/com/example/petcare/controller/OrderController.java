package com.example.petcare.controller;

import com.example.petcare.auth.AuthContext;
import com.example.petcare.common.ApiResponse;
import com.example.petcare.dto.CancelOrderRequest;
import com.example.petcare.dto.CreateOrderRequest;
import com.example.petcare.dto.CreateOrderResponse;
import com.example.petcare.dto.OrderDetailResponse;
import com.example.petcare.dto.OrderListItemResponse;
import com.example.petcare.service.OrderService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
        request.setUserId(AuthContext.requireCurrentUserId());
        return ApiResponse.success("下单成功", orderService.createOrder(request));
    }

    @GetMapping("/detail")
    public ApiResponse<OrderDetailResponse> detail(@RequestParam Long id, @RequestParam(required = false) Long userId) {
        return ApiResponse.success(orderService.detail(id, AuthContext.requireCurrentUserId()));
    }

    @PostMapping("/cancel")
    public ApiResponse<Void> cancel(@RequestBody CancelOrderRequest request) {
        request.setUserId(AuthContext.requireCurrentUserId());
        orderService.cancelOrder(request);
        return ApiResponse.success("取消订单成功", null);
    }

    @GetMapping("/list")
    public ApiResponse<List<OrderListItemResponse>> list(@RequestParam(required = false) Long userId) {
        return ApiResponse.success(orderService.list(AuthContext.requireCurrentUserId()));
    }
}
