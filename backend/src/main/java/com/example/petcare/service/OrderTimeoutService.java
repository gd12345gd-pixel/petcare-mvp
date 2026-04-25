package com.example.petcare.service;

import com.example.petcare.entity.PetOrder;
import com.example.petcare.entity.PetOrderLog;
import com.example.petcare.entity.PetOrderSchedule;
import com.example.petcare.repository.PetOrderLogRepository;
import com.example.petcare.repository.PetOrderRepository;
import com.example.petcare.repository.PetOrderScheduleRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class OrderTimeoutService {

    private final PetOrderRepository petOrderRepository;
    private final PetOrderScheduleRepository petOrderScheduleRepository;
    private final PetOrderLogRepository petOrderLogRepository;
    private final NotificationService notificationService;

    public OrderTimeoutService(PetOrderRepository petOrderRepository,
                               PetOrderScheduleRepository petOrderScheduleRepository,
                               PetOrderLogRepository petOrderLogRepository,
                               NotificationService notificationService) {
        this.petOrderRepository = petOrderRepository;
        this.petOrderScheduleRepository = petOrderScheduleRepository;
        this.petOrderLogRepository = petOrderLogRepository;
        this.notificationService = notificationService;
    }

    @Scheduled(fixedDelay = 10 * 60 * 1000, initialDelay = 60 * 1000)
    @Transactional
    public void cancelTimeoutWaitTakingOrders() {
        LocalDate today = LocalDate.now();
        List<PetOrder> orders = petOrderRepository.findTimeoutWaitTakingOrders(today);
        for (PetOrder order : orders) {
            cancelTimeoutOrder(order);
        }
    }

    private void cancelTimeoutOrder(PetOrder order) {
        order.setOrderStatus("CANCELLED");
        petOrderRepository.save(order);

        List<PetOrderSchedule> schedules = petOrderScheduleRepository.findByOrderIdOrderByServiceDateAsc(order.getId());
        for (PetOrderSchedule schedule : schedules) {
            schedule.setScheduleStatus("CANCELLED");
        }
        petOrderScheduleRepository.saveAll(schedules);

        PetOrderLog log = new PetOrderLog();
        log.setOrderId(order.getId());
        log.setAction("SYSTEM_TIMEOUT_CANCEL");
        log.setOperatorType("SYSTEM");
        log.setOperatorId(null);
        log.setRemark("首个服务日次日凌晨仍未被接单，系统自动取消订单");
        petOrderLogRepository.save(log);

        notificationService.create(
                order.getUserId(),
                "ORDER",
                "订单已超时取消",
                "你的预约订单因超过服务开始日仍无人接单，系统已自动取消。如仍需服务，请重新下单。",
                "ORDER",
                order.getId(),
                "/pages/order/detail/index?id=" + order.getId()
        );
    }
}
