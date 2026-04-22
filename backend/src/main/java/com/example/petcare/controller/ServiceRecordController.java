package com.example.petcare.controller;

import com.example.petcare.common.ApiResponse;
import com.example.petcare.dto.ServiceRecordCreateRequest;
import com.example.petcare.dto.ServiceRecordDetailResponse;
import com.example.petcare.dto.ServiceRecordListItemResponse;
import com.example.petcare.service.ServiceRecordService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-record")
@CrossOrigin
public class ServiceRecordController {

    private final ServiceRecordService serviceRecordService;

    public ServiceRecordController(ServiceRecordService serviceRecordService) {
        this.serviceRecordService = serviceRecordService;
    }

    @PostMapping("/create")
    public ApiResponse<Long> create(@RequestBody ServiceRecordCreateRequest request) {
        return ApiResponse.success("提交服务记录成功", serviceRecordService.create(request));
    }

    @GetMapping("/listByOrder")
    public ApiResponse<List<ServiceRecordListItemResponse>> listByOrder(@RequestParam Long orderId) {
        return ApiResponse.success(serviceRecordService.listByOrder(orderId));
    }

    @GetMapping("/detail")
    public ApiResponse<ServiceRecordDetailResponse> detail(@RequestParam Long id) {
        return ApiResponse.success(serviceRecordService.detail(id));
    }
}