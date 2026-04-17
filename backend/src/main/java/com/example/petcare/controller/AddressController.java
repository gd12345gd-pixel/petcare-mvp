package com.example.petcare.controller;

import com.example.petcare.common.ApiResponse;

import com.example.petcare.dto.*;
import com.example.petcare.service.AddressService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/address")
@CrossOrigin
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping("/list")
    public ApiResponse<List<AddressResponse>> list(@RequestParam Long userId) {
        return ApiResponse.success(addressService.list(userId));
    }

    @GetMapping("/detail")
    public ApiResponse<AddressResponse> detail(@RequestParam Long id) {
        return ApiResponse.success(addressService.detail(id));
    }

    @PostMapping("/create")
    public ApiResponse<AddressResponse> create(@RequestBody AddressCreateRequest request) {
        return ApiResponse.success("新增地址成功", addressService.create(request));
    }

    @PostMapping("/update")
    public ApiResponse<AddressResponse> update(@RequestBody AddressUpdateRequest request) {
        return ApiResponse.success("修改地址成功", addressService.update(request));
    }

    @PostMapping("/delete")
    public ApiResponse<Void> delete(@RequestBody AddressDeleteRequest request) {
        addressService.delete(request);
        return ApiResponse.success("删除地址成功", null);
    }

    @PostMapping("/set-default")
    public ApiResponse<Void> setDefault(@RequestBody AddressSetDefaultRequest request) {
        addressService.setDefault(request);
        return ApiResponse.success("设置默认地址成功", null);
    }
}