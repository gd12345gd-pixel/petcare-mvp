package com.example.petcare.service;

import com.example.petcare.dto.CreateServiceRecordRequest;
import com.example.petcare.dto.ServiceRecordVO;
import com.example.petcare.entity.Orders;
import com.example.petcare.entity.ServiceRecord;
import com.example.petcare.enums.OrderStatus;
import com.example.petcare.repository.OrdersRepository;
import com.example.petcare.repository.ServiceRecordRepository;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class  ServiceRecordService {

    private final OrdersRepository orderRepository;
    private final ServiceRecordRepository serviceRecordRepository;

    public ServiceRecordService(OrdersRepository orderRepository,
        ServiceRecordRepository serviceRecordRepository) {
        this.orderRepository = orderRepository;
        this.serviceRecordRepository = serviceRecordRepository;
    }


    @Transactional
    public void startService(Long orderId) {
        Orders order = getOrder(orderId);

        if (OrderStatus.COMPLETED.name().equals(order.getStatus())) {
            throw new RuntimeException("订单已完成，不能再次开始服务");
        }

        order.setStatus(OrderStatus.IN_SERVICE );
        order.setStartTime(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
    }


    @Transactional
    public void createRecord(CreateServiceRecordRequest request) {
        if (request.getOrderId() == null) {
            throw new RuntimeException("orderId不能为空");
        }
        if (request.getType() == null || request.getType().isBlank()) {
            throw new RuntimeException("type不能为空");
        }
        if ((request.getImageUrl() == null || request.getImageUrl().isBlank())
            && (request.getVideoUrl() == null || request.getVideoUrl().isBlank())) {
            throw new RuntimeException("图片或视频至少上传一个");
        }

        Orders order = getOrder(request.getOrderId());

        if (!OrderStatus.IN_SERVICE.equals(order.getStatus())) {
            throw new RuntimeException("当前订单不处于服务中，不能上传记录");
        }

        ServiceRecord record = new ServiceRecord();
        record.setOrderId(request.getOrderId());
        record.setType(request.getType());
        record.setImageUrl(request.getImageUrl());
        record.setVideoUrl(request.getVideoUrl());
        record.setDescription(request.getDescription());
        record.setCreatedAt(LocalDateTime.now());
        record.setUpdatedAt(LocalDateTime.now());

        serviceRecordRepository.save(record);
    }


    @Transactional
    public void completeService(Long orderId) {
        Orders order = getOrder(orderId);

        if (!OrderStatus.IN_SERVICE.equals(order.getStatus())) {
            throw new RuntimeException("当前订单不处于服务中，不能结束服务");
        }

        order.setStatus(OrderStatus.COMPLETED );
        order.setEndTime(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
    }


    public List<ServiceRecordVO> listByOrderId(Long orderId) {
        List<ServiceRecord> list = serviceRecordRepository.findByOrderIdOrderByCreatedAtAsc(orderId);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        return list.stream()
            .map(item -> new ServiceRecordVO(
                item.getId(),
                item.getOrderId(),
                item.getType(),
                item.getImageUrl(),
                item.getVideoUrl(),
                item.getDescription(),
                item.getCreatedAt() == null ? null : item.getCreatedAt().format(formatter)
            ))
            .toList();
    }

    private Orders getOrder(Long orderId) {
        return orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("订单不存在"));
    }
}