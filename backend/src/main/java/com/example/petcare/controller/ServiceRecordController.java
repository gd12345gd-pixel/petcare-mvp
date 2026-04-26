package com.example.petcare.controller;

import com.example.petcare.auth.AuthContext;
import com.example.petcare.common.ApiResponse;
import com.example.petcare.dto.ServiceRecordCreateRequest;
import com.example.petcare.dto.ServiceRecordDetailResponse;
import com.example.petcare.entity.ServiceRecord;
import com.example.petcare.entity.SitterProfile;
import com.example.petcare.repository.SitterProfileRepository;
import com.example.petcare.service.ServiceRecordService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-record")
@CrossOrigin
public class ServiceRecordController {

    private final ServiceRecordService serviceRecordService;
    private final SitterProfileRepository sitterProfileRepository;

    public ServiceRecordController(ServiceRecordService serviceRecordService,
                                   SitterProfileRepository sitterProfileRepository) {
        this.serviceRecordService = serviceRecordService;
        this.sitterProfileRepository = sitterProfileRepository;
    }

    @PostMapping("/create")
    public ApiResponse<ServiceRecord> create(@RequestBody ServiceRecordCreateRequest request) {
        request.setSitterId(currentSitterProfile().getId());
        return ApiResponse.success("提交服务记录成功", serviceRecordService.create(request));
    }

    @GetMapping("/listByOrder")
    public ApiResponse<List<ServiceRecord>> listByOrder(@RequestParam Long orderId) {
        return ApiResponse.success(serviceRecordService.listByOrder(orderId));
    }

    @GetMapping("/detail")
    public ApiResponse<ServiceRecordDetailResponse> detail(@RequestParam Long id) {
        return ApiResponse.success(serviceRecordService.detail(id));
    }

    private SitterProfile currentSitterProfile() {
        Long userId = AuthContext.requireCurrentUserId();
        return sitterProfileRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("请先注册成为接单师"));
    }
}