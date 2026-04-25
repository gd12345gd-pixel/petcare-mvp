package com.example.petcare.controller;

import com.example.petcare.auth.AuthContext;
import com.example.petcare.common.ApiResponse;
import com.example.petcare.dto.FeedbackCreateRequest;
import com.example.petcare.dto.FeedbackResponse;
import com.example.petcare.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
@CrossOrigin
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    public ApiResponse<FeedbackResponse> submit(@RequestBody FeedbackCreateRequest request) {
        return ApiResponse.success("反馈已提交", feedbackService.submit(AuthContext.requireCurrentUserId(), request));
    }

    @GetMapping("/mine")
    public ApiResponse<List<FeedbackResponse>> mine() {
        return ApiResponse.success(feedbackService.listMine(AuthContext.requireCurrentUserId()));
    }
}
