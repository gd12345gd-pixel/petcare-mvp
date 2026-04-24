package com.example.petcare.controller;

import com.example.petcare.auth.AuthContext;
import com.example.petcare.common.ApiResponse;
import com.example.petcare.dto.AddressCreateRequest;
import com.example.petcare.dto.AddressDeleteRequest;
import com.example.petcare.dto.AddressResponse;
import com.example.petcare.dto.AddressSetDefaultRequest;
import com.example.petcare.dto.AddressUpdateRequest;
import com.example.petcare.service.AddressService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
    public ApiResponse<List<AddressResponse>> list(@RequestParam(required = false) Long userId) {
        return ApiResponse.success(addressService.list(AuthContext.requireCurrentUserId()));
    }

    @GetMapping("/detail")
    public ApiResponse<AddressResponse> detail(@RequestParam Long id) {
        return ApiResponse.success(addressService.detail(id));
    }

    @PostMapping("/create")
    public ApiResponse<AddressResponse> create(@RequestBody AddressCreateRequest request) {
        request.setUserId(AuthContext.requireCurrentUserId());
        return ApiResponse.success("新增地址成功", addressService.create(request));
    }

    @PostMapping("/update")
    public ApiResponse<AddressResponse> update(@RequestBody AddressUpdateRequest request) {
        request.setUserId(AuthContext.requireCurrentUserId());
        return ApiResponse.success("修改地址成功", addressService.update(request));
    }

    @PostMapping("/delete")
    public ApiResponse<Void> delete(@RequestBody AddressDeleteRequest request) {
        request.setUserId(AuthContext.requireCurrentUserId());
        addressService.delete(request);
        return ApiResponse.success("删除地址成功", null);
    }

    @PostMapping("/set-default")
    public ApiResponse<Void> setDefault(@RequestBody AddressSetDefaultRequest request) {
        request.setUserId(AuthContext.requireCurrentUserId());
        addressService.setDefault(request);
        return ApiResponse.success("设置默认地址成功", null);
    }
}
