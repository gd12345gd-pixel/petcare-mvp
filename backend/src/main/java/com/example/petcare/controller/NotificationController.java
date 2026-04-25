package com.example.petcare.controller;

import com.example.petcare.auth.AuthContext;
import com.example.petcare.common.ApiResponse;
import com.example.petcare.dto.NotificationResponse;
import com.example.petcare.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<List<NotificationResponse>> listMine() {
        return ApiResponse.success(notificationService.listMine(AuthContext.requireCurrentUserId()));
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> unreadCount() {
        long count = notificationService.unreadCount(AuthContext.requireCurrentUserId());
        return ApiResponse.success(Map.of("count", count));
    }

    @PostMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markRead(@PathVariable Long id) {
        return ApiResponse.success(notificationService.markRead(AuthContext.requireCurrentUserId(), id));
    }

    @PostMapping("/read-all")
    public ApiResponse<Void> markAllRead() {
        notificationService.markAllRead(AuthContext.requireCurrentUserId());
        return ApiResponse.success("已全部标记为已读", null);
    }
}
