package com.example.petcare.controller;

import com.example.petcare.auth.AuthContext;
import com.example.petcare.common.ApiResponse;
import com.example.petcare.dto.AddOrderRemarkRequest;
import com.example.petcare.dto.OrderRemarkResponse;
import com.example.petcare.service.OrderRemarkService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/order/remark")
@CrossOrigin
public class OrderRemarkController {

    private final OrderRemarkService orderRemarkService;

    public OrderRemarkController(OrderRemarkService orderRemarkService) {
        this.orderRemarkService = orderRemarkService;
    }

    @PostMapping("/add")
    public ApiResponse<OrderRemarkResponse> add(@RequestBody AddOrderRemarkRequest request) {
        request.setUserId(AuthContext.requireCurrentUserId());
        return ApiResponse.success("补充说明已提交", orderRemarkService.addUserRemark(request));
    }
}
