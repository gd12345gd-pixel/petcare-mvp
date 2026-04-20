package com.example.petcare.controller;

import com.example.petcare.common.ApiResponse;
import com.example.petcare.dto.PetCreateRequest;
import com.example.petcare.dto.PetResponse;
import com.example.petcare.dto.PetUpdateRequest;
import com.example.petcare.service.PetService;
import org.springframework.web.bind.annotation.*;

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
    public ApiResponse<List<PetResponse>> list(@RequestParam Long userId) {
        return ApiResponse.success(petService.list(userId));
    }

    @GetMapping("/detail")
    public ApiResponse<PetResponse> detail(@RequestParam Long id) {
        return ApiResponse.success(petService.detail(id));
    }

    @PostMapping("/create")
    public ApiResponse<PetResponse> create(@RequestBody PetCreateRequest request) {
        return ApiResponse.success("新增宠物成功", petService.create(request));
    }

    @PostMapping("/update")
    public ApiResponse<PetResponse> update(@RequestBody PetUpdateRequest request) {
        return ApiResponse.success("修改宠物成功", petService.update(request));
    }
}