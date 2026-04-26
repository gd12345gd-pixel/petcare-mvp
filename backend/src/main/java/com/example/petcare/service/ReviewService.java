package com.example.petcare.service;

import com.example.petcare.dto.ReviewResponse;
import com.example.petcare.dto.ReviewSubmitRequest;
import com.example.petcare.entity.PetOrder;
import com.example.petcare.entity.Review;
import com.example.petcare.repository.PetOrderRepository;
import com.example.petcare.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final PetOrderRepository petOrderRepository;
    private final SitterGrowthLogService sitterGrowthLogService;

    public ReviewService(ReviewRepository reviewRepository,
                         PetOrderRepository petOrderRepository,
                         SitterGrowthLogService sitterGrowthLogService) {
        this.reviewRepository = reviewRepository;
        this.petOrderRepository = petOrderRepository;
        this.sitterGrowthLogService = sitterGrowthLogService;
    }

    @Transactional
    public ReviewResponse submit(ReviewSubmitRequest request) {
        if (request.getOrderId() == null) {
            throw new RuntimeException("订单ID不能为空");
        }
        if (request.getUserId() == null) {
            throw new RuntimeException("用户ID不能为空");
        }

        PetOrder order = petOrderRepository.findByIdAndUserIdAndDeleted(request.getOrderId(), request.getUserId(), 0)
                .orElseThrow(() -> new RuntimeException("订单不存在"));
        if (!"COMPLETED".equals(order.getOrderStatus())) {
            throw new RuntimeException("服务全部完成后才可以评价");
        }
        if (order.getSitterId() == null) {
            throw new RuntimeException("订单暂无接单师，不能评价");
        }
        if (reviewRepository.existsByOrderIdAndUserId(order.getId(), request.getUserId())) {
            throw new RuntimeException("该订单已评价");
        }
        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new RuntimeException("请选择1-5星评分");
        }

        List<String> tags = sanitizeTags(request.getTags());
        String content = request.getContent() == null ? "" : request.getContent().trim();
        if (content.length() > 200) {
            throw new RuntimeException("评价备注最多200字");
        }

        Review review = new Review();
        review.setOrderId(order.getId());
        review.setUserId(request.getUserId());
        review.setSitterId(order.getSitterId());
        review.setRating(request.getRating());
        review.setTags(String.join(",", tags));
        review.setContent(content);
        review.setCreatedAt(LocalDateTime.now());
        Review saved = reviewRepository.save(review);
        int growthValue = request.getRating() >= 4 ? 3 : 1;
        sitterGrowthLogService.log(order.getSitterId(), order.getId(), growthValue, "REVIEW_RECEIVED", "收到用户评价");
        return toResponse(saved);
    }

    public ReviewResponse findByOrder(Long orderId, Long userId) {
        return reviewRepository.findByOrderIdAndUserId(orderId, userId)
                .map(this::toResponse)
                .orElse(null);
    }

    private List<String> sanitizeTags(List<String> tags) {
        if (tags == null) {
            return new ArrayList<>();
        }
        return tags.stream()
                .filter(item -> item != null && !item.trim().isEmpty())
                .map(String::trim)
                .distinct()
                .limit(6)
                .collect(Collectors.toList());
    }

    private ReviewResponse toResponse(Review review) {
        ReviewResponse response = new ReviewResponse();
        response.setId(review.getId());
        response.setOrderId(review.getOrderId());
        response.setUserId(review.getUserId());
        response.setSitterId(review.getSitterId());
        response.setRating(review.getRating());
        response.setTags(parseTags(review.getTags()));
        response.setContent(review.getContent());
        response.setCreatedAt(review.getCreatedAt());
        return response;
    }

    private List<String> parseTags(String tags) {
        if (tags == null || tags.trim().isEmpty()) {
            return new ArrayList<>();
        }
        return Arrays.stream(tags.split(","))
                .filter(item -> !item.trim().isEmpty())
                .map(String::trim)
                .collect(Collectors.toList());
    }
}
