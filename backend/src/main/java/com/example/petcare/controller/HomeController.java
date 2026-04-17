package com.example.petcare.controller;

import com.example.petcare.common.ApiResponse;
import com.example.petcare.service.HomeService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/home")
public class HomeController {

    private final HomeService homeService;

    public HomeController(HomeService homeService) {
        this.homeService = homeService;
    }

    @GetMapping
    public ApiResponse<?> home() {
        return ApiResponse.success(homeService.getHomeData());
    }
}
