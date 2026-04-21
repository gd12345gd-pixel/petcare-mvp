package com.example.petcare.controller;

import com.example.petcare.common.Result;
import com.example.petcare.common.ApiResponse;
import com.example.petcare.dto.CreateOrderRequest;
import com.example.petcare.dto.CreateOrderResponse;
import com.example.petcare.dto.OrderStatusUpdateRequest;
import com.example.petcare.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/createOrder")
    public Result<CreateOrderResponse> createOrder(@RequestBody CreateOrderRequest request) {
        return Result.success(orderService.createOrder(request));
    }

    @GetMapping
    public ApiResponse<?> listByUser(@RequestParam Long userId) {
        return ApiResponse.success(orderService.listByUserId(userId));
    }

    @GetMapping("/{id}")
    public ApiResponse<?> detail(@PathVariable Long id) {
        return ApiResponse.success(orderService.detail(id));
    }

    @PutMapping("/{id}/status")
    public ApiResponse<?> updateStatus(
        @PathVariable Long id,
        @Valid @RequestBody OrderStatusUpdateRequest request
    ) {
        return ApiResponse.success(orderService.updateStatus(id, request.getStatus()));
    }
}
