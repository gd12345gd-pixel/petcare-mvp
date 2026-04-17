package com.example.petcare.controller;

import com.example.petcare.common.Result;
import com.example.petcare.dto.CompleteServiceRequest;
import com.example.petcare.dto.CreateServiceRecordRequest;
import com.example.petcare.dto.ServiceRecordVO;
import com.example.petcare.dto.StartServiceRequest;
import com.example.petcare.service.ServiceRecordService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-records")
public class ServiceRecordController {

    private final ServiceRecordService serviceRecordService;

    public ServiceRecordController(ServiceRecordService serviceRecordService) {
        this.serviceRecordService = serviceRecordService;
    }

    @PostMapping("/start")
    public Result<Void> startService(@RequestBody StartServiceRequest request) {
        serviceRecordService.startService(request.getOrderId());
        return Result.success(null);
    }

    @PostMapping
    public Result<Void> createRecord(@RequestBody CreateServiceRecordRequest request) {
        serviceRecordService.createRecord(request);
        return Result.success(null);
    }

    @PostMapping("/complete")
    public Result<Void> completeService(@RequestBody CompleteServiceRequest request) {
        serviceRecordService.completeService(request.getOrderId());
        return Result.success(null);
    }

    @GetMapping
    public Result<List<ServiceRecordVO>> list(@RequestParam Long orderId) {
        return Result.success(serviceRecordService.listByOrderId(orderId));
    }
}