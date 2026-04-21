package com.example.petcare.service;

import com.example.petcare.dto.CreateOrderRequest;
import com.example.petcare.dto.CreateOrderResponse;
import com.example.petcare.entity.Orders;
import com.example.petcare.entity.ServiceItem;
import com.example.petcare.enums.OrderStatus;
import com.example.petcare.enums.PaymentStatus;
import com.example.petcare.repository.OrdersRepository;
import com.example.petcare.repository.ServiceItemRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final OrdersRepository ordersRepository;
    private final ServiceItemRepository serviceItemRepository;

    public OrderService(OrdersRepository ordersRepository, ServiceItemRepository serviceItemRepository) {
        this.ordersRepository = ordersRepository;
        this.serviceItemRepository = serviceItemRepository;
    }

    @Transactional
    public CreateOrderResponse createOrder(CreateOrderRequest request) {
        if (request.getUserId() == null) {
            throw new RuntimeException("userId不能为空");
        }
        if (request.getServiceItemId() == null) {
            throw new RuntimeException("serviceItemIgd不能为空");
        }
        if (request.getServiceDate() == null || request.getServiceDate().isEmpty()) {
            throw new RuntimeException("服务日期不能为空");
        }
        if (request.getTimeSlot() == null || request.getTimeSlot().isEmpty()) {
            throw new RuntimeException("时间段不能为空");
        }
        if (request.getAddress() == null || request.getAddress().isEmpty()) {
            throw new RuntimeException("服务地址不能为空");
        }
        if (request.getContactName() == null || request.getContactName().isEmpty()) {
            throw new RuntimeException("联系人不能为空");
        }
        if (request.getContactPhone() == null || request.getContactPhone().isEmpty()) {
            throw new RuntimeException("联系电话不能为空");
        }

        ServiceItem serviceItem = serviceItemRepository
            .findById(request.getServiceItemId())
            .orElseThrow(() -> new RuntimeException("服务项目不存在"));

        Orders order = new Orders();
        order.setOrderNo(generateOrderNo());
        order.setUserId(request.getUserId());
        order.setSitterId(request.getSitterId());
        order.setServiceItemId(request.getServiceItemId());
        order.setServiceDate(LocalDate.parse(request.getServiceDate()));
        order.setTimeSlot(request.getTimeSlot());
        order.setAddress(request.getAddress());
        order.setContactName(request.getContactName());
        order.setContactPhone(request.getContactPhone());
        order.setNote(request.getNote());
        order.setAmount(serviceItem.getPrice());
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.UNPAID);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        Orders saved = ordersRepository.save(order);
        return new CreateOrderResponse(saved.getId(), saved.getOrderNo());
    }

    private String generateOrderNo() {
        String prefix = "PC";
        String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int random = (int) ((Math.random() * 900) + 100);
        return prefix + time + random;
    }

    public List<Orders> listByUserId(Long userId) {
        return ordersRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Orders detail(Long id) {
        return ordersRepository
            .findById(id)
            .orElseThrow(() -> new EntityNotFoundException("订单不存在"));
    }

    public Orders updateStatus(Long id, OrderStatus status) {
        Orders o = detail(id);
        o.setStatus(status);
        if (status == OrderStatus.CONFIRMED || status == OrderStatus.COMPLETED) {
            o.setPaymentStatus(PaymentStatus.PAID);
        }
        return ordersRepository.save(o);
    }

    private String generateOrderNo(String yyyymmdd) {
        long count = ordersRepository.count() + 1;
        return "PC" + yyyymmdd + String.format("%04d", count);
    }
}
