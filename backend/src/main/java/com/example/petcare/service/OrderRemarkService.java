package com.example.petcare.service;

import com.example.petcare.dto.AddOrderRemarkRequest;
import com.example.petcare.dto.OrderRemarkResponse;
import com.example.petcare.entity.OrderRemarkRecord;
import com.example.petcare.entity.PetOrder;
import com.example.petcare.entity.SitterProfile;
import com.example.petcare.repository.OrderRemarkRecordRepository;
import com.example.petcare.repository.PetOrderRepository;
import com.example.petcare.repository.SitterProfileRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderRemarkService {

    private static final int MAX_CONTENT_LENGTH = 100;
    private static final int MAX_IMAGE_COUNT = 3;

    private final OrderRemarkRecordRepository remarkRecordRepository;
    private final PetOrderRepository petOrderRepository;
    private final SitterProfileRepository sitterProfileRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OrderRemarkService(OrderRemarkRecordRepository remarkRecordRepository,
                              PetOrderRepository petOrderRepository,
                              SitterProfileRepository sitterProfileRepository,
                              NotificationService notificationService) {
        this.remarkRecordRepository = remarkRecordRepository;
        this.petOrderRepository = petOrderRepository;
        this.sitterProfileRepository = sitterProfileRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public OrderRemarkResponse addUserRemark(AddOrderRemarkRequest request) {
        if (request.getOrderId() == null) {
            throw new RuntimeException("订单ID不能为空");
        }
        if (request.getUserId() == null) {
            throw new RuntimeException("用户ID不能为空");
        }

        PetOrder order = petOrderRepository.findByIdAndUserIdAndDeleted(request.getOrderId(), request.getUserId(), 0)
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        if (!canAppendRemark(order.getOrderStatus())) {
            throw new RuntimeException("当前订单状态不允许补充备注");
        }

        String content = request.getContent() == null ? "" : request.getContent().trim();
        if (content.isEmpty()) {
            throw new RuntimeException("补充说明不能为空");
        }
        if (content.length() > MAX_CONTENT_LENGTH) {
            throw new RuntimeException("补充说明最多100字");
        }

        List<String> imageUrls = sanitizeImageUrls(request.getImageUrls());
        if (imageUrls.size() > MAX_IMAGE_COUNT) {
            throw new RuntimeException("图片最多上传3张");
        }

        OrderRemarkRecord record = new OrderRemarkRecord();
        record.setOrderId(order.getId());
        record.setUserId(request.getUserId());
        record.setSubmitterType("USER");
        record.setContent(content);
        record.setImageUrlsJson(toJson(imageUrls));
        record.setHidden(0);
        OrderRemarkRecord saved = remarkRecordRepository.save(record);

        notifySitterIfNeeded(order);

        return toResponse(saved);
    }

    public List<OrderRemarkResponse> timeline(PetOrder order) {
        List<OrderRemarkResponse> result = new ArrayList<>();
        if (order == null) {
            return result;
        }

        if (order.getRemark() != null && !order.getRemark().trim().isEmpty()) {
            OrderRemarkResponse original = new OrderRemarkResponse();
            original.setOrderId(order.getId());
            original.setRemarkType("ORIGINAL");
            original.setSubmitterType("USER");
            original.setUserId(order.getUserId());
            original.setContent(order.getRemark().trim());
            original.setImageUrls(new ArrayList<>());
            original.setCreatedAt(order.getCreatedAt());
            result.add(original);
        }

        result.addAll(remarkRecordRepository.findByOrderIdAndHiddenOrderByCreatedAtAsc(order.getId(), 0)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList()));

        result.sort(Comparator.comparing(
                item -> item.getCreatedAt() == null ? LocalDateTime.MIN : item.getCreatedAt()
        ));
        return result;
    }

    public boolean canAppendRemark(String orderStatus) {
        return "WAIT_TAKING".equals(orderStatus)
                || "TAKEN".equals(orderStatus)
                || "SERVING".equals(orderStatus)
                || "PART_SERVING".equals(orderStatus)
                || "PART_COMPLETED".equals(orderStatus)
                || "EXCEPTION".equals(orderStatus);
    }

    private void notifySitterIfNeeded(PetOrder order) {
        if (order.getSitterId() == null) {
            return;
        }

        sitterProfileRepository.findById(order.getSitterId())
                .map(SitterProfile::getUserId)
                .filter(userId -> userId != null)
                .ifPresent(userId -> notificationService.create(
                        userId,
                        "ORDER_REMARK",
                        "订单有新的补充说明",
                        "用户补充了新的照护注意事项，请及时查看。",
                        "ORDER",
                        order.getId(),
                        "/pages/sitter/order-detail/index?id=" + order.getId()
                ));
    }

    private List<String> sanitizeImageUrls(List<String> imageUrls) {
        if (imageUrls == null) {
            return new ArrayList<>();
        }
        return imageUrls.stream()
                .filter(item -> item != null && !item.trim().isEmpty())
                .map(String::trim)
                .collect(Collectors.toList());
    }

    private OrderRemarkResponse toResponse(OrderRemarkRecord record) {
        OrderRemarkResponse response = new OrderRemarkResponse();
        response.setId(record.getId());
        response.setOrderId(record.getOrderId());
        response.setRemarkType("SUPPLEMENT");
        response.setSubmitterType(record.getSubmitterType());
        response.setUserId(record.getUserId());
        response.setContent(record.getContent());
        response.setImageUrls(parseJsonList(record.getImageUrlsJson()));
        response.setCreatedAt(record.getCreatedAt());
        return response;
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException("JSON转换失败");
        }
    }

    private List<String> parseJsonList(String json) {
        try {
            if (json == null || json.trim().isEmpty()) {
                return new ArrayList<>();
            }
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
