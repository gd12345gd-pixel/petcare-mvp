package com.example.petcare.controller;

import com.example.petcare.auth.AuthContext;
import com.example.petcare.common.ApiResponse;
import com.example.petcare.dto.PetCreateRequest;
import com.example.petcare.dto.PetResponse;
import com.example.petcare.dto.PetUpdateRequest;
import com.example.petcare.service.PetService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/pet")
@CrossOrigin
public class PetController {

    private final PetService petService;

    public PetController(PetService petService) {
        this.petService = petService;
    }

    @GetMapping("/list")
    public ApiResponse<List<PetResponse>> list(@RequestParam(required = false) Long userId) {
        return ApiResponse.success(petService.list(AuthContext.requireCurrentUserId()));
    }

    @GetMapping("/detail")
    public ApiResponse<PetResponse> detail(@RequestParam Long id) {
        return ApiResponse.success(petService.detail(id));
    }

    @PostMapping("/create")
    public ApiResponse<PetResponse> create(@RequestBody PetCreateRequest request) {
        request.setUserId(AuthContext.requireCurrentUserId());
        return ApiResponse.success("新增宠物成功", petService.create(request));
    }

    @PostMapping("/update")
    public ApiResponse<PetResponse> update(@RequestBody PetUpdateRequest request) {
        request.setUserId(AuthContext.requireCurrentUserId());
        return ApiResponse.success("修改宠物成功", petService.update(request));
    }
}
