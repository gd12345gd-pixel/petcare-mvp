package com.example.petcare.service;

import com.example.petcare.dto.FeedbackCreateRequest;
import com.example.petcare.dto.FeedbackResponse;
import com.example.petcare.entity.UserFeedback;
import com.example.petcare.repository.UserFeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final UserFeedbackRepository feedbackRepository;
    private final NotificationService notificationService;

    @Transactional
    public FeedbackResponse submit(Long userId, FeedbackCreateRequest request) {
        if (request == null) {
            throw new RuntimeException("反馈内容不能为空");
        }
        if (isBlank(request.getContent())) {
            throw new RuntimeException("请填写问题描述");
        }

        UserFeedback feedback = new UserFeedback();
        feedback.setUserId(userId);
        feedback.setFeedbackType(firstText(request.getFeedbackType(), "OTHER"));
        feedback.setContent(request.getContent().trim());
        feedback.setContactPhone(trimToNull(request.getContactPhone()));
        feedback.setOrderNo(trimToNull(request.getOrderNo()));
        feedback.setStatus("PENDING");
        feedback.setCreatedAt(LocalDateTime.now());
        feedback.setUpdatedAt(LocalDateTime.now());
        UserFeedback saved = feedbackRepository.save(feedback);
        notificationService.create(
                userId,
                "FEEDBACK",
                "反馈已收到",
                "你的问题反馈已提交，平台会尽快查看并处理。",
                "FEEDBACK",
                saved.getId(),
                "/pages/feedback/index"
        );
        return toResponse(saved);
    }

    public List<FeedbackResponse> listMine(Long userId) {
        return feedbackRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private FeedbackResponse toResponse(UserFeedback feedback) {
        FeedbackResponse response = new FeedbackResponse();
        response.setId(feedback.getId());
        response.setUserId(feedback.getUserId());
        response.setFeedbackType(feedback.getFeedbackType());
        response.setContent(feedback.getContent());
        response.setContactPhone(feedback.getContactPhone());
        response.setOrderNo(feedback.getOrderNo());
        response.setStatus(feedback.getStatus());
        response.setCreatedAt(feedback.getCreatedAt());
        return response;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String firstText(String value, String fallback) {
        return isBlank(value) ? fallback : value.trim();
    }

    private String trimToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }
}
