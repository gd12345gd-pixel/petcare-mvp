package com.example.petcare.service;

import com.example.petcare.dto.NotificationResponse;
import com.example.petcare.entity.UserNotification;
import com.example.petcare.repository.UserNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final UserNotificationRepository notificationRepository;

    @Transactional
    public NotificationResponse create(Long userId, String noticeType, String title, String content,
                                       String targetType, Long targetId, String targetUrl) {
        UserNotification notification = new UserNotification();
        notification.setUserId(userId);
        notification.setNoticeType(firstText(noticeType, "SYSTEM"));
        notification.setTitle(firstText(title, "系统通知"));
        notification.setContent(firstText(content, ""));
        notification.setTargetType(trimToNull(targetType));
        notification.setTargetId(targetId);
        notification.setTargetUrl(trimToNull(targetUrl));
        notification.setReadFlag(false);
        notification.setCreatedAt(LocalDateTime.now());
        return toResponse(notificationRepository.save(notification));
    }

    public List<NotificationResponse> listMine(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public long unreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFlagFalse(userId);
    }

    @Transactional
    public NotificationResponse markRead(Long userId, Long id) {
        UserNotification notification = notificationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("消息不存在"));
        if (!Boolean.TRUE.equals(notification.getReadFlag())) {
            notification.setReadFlag(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
        return toResponse(notification);
    }

    @Transactional
    public void markAllRead(Long userId) {
        List<UserNotification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        LocalDateTime now = LocalDateTime.now();
        for (UserNotification item : notifications) {
            if (!Boolean.TRUE.equals(item.getReadFlag())) {
                item.setReadFlag(true);
                item.setReadAt(now);
            }
        }
        notificationRepository.saveAll(notifications);
    }

    private NotificationResponse toResponse(UserNotification notification) {
        NotificationResponse response = new NotificationResponse();
        response.setId(notification.getId());
        response.setUserId(notification.getUserId());
        response.setNoticeType(notification.getNoticeType());
        response.setTitle(notification.getTitle());
        response.setContent(notification.getContent());
        response.setTargetType(notification.getTargetType());
        response.setTargetId(notification.getTargetId());
        response.setTargetUrl(notification.getTargetUrl());
        response.setReadFlag(notification.getReadFlag());
        response.setReadAt(notification.getReadAt());
        response.setCreatedAt(notification.getCreatedAt());
        return response;
    }

    private String firstText(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }

    private String trimToNull(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }
}
