package com.example.petcare.controller;

import com.example.petcare.auth.AuthContext;
import com.example.petcare.common.ApiResponse;
import com.example.petcare.dto.ReviewResponse;
import com.example.petcare.dto.ReviewSubmitRequest;
import com.example.petcare.service.ReviewService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/submit")
    public ApiResponse<ReviewResponse> submit(@RequestBody ReviewSubmitRequest request) {
        request.setUserId(AuthContext.requireCurrentUserId());
        return ApiResponse.success("评价已提交", reviewService.submit(request));
    }
}
