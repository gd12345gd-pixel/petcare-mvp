package com.example.petcare.service;

import com.example.petcare.dto.*;
import com.example.petcare.entity.PetOrder;
import com.example.petcare.entity.PetOrderLog;
import com.example.petcare.entity.PetOrderPet;
import com.example.petcare.entity.PetOrderSchedule;
import com.example.petcare.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SitterOrderService {

    private final PetOrderRepository petOrderRepository;
    private final PetOrderPetRepository petOrderPetRepository;
    private final PetOrderScheduleRepository petOrderScheduleRepository;
    private final PetOrderLogRepository petOrderLogRepository;
    private final ServiceRecordRepository serviceRecordRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public SitterOrderService(PetOrderRepository petOrderRepository,
        PetOrderPetRepository petOrderPetRepository,
        PetOrderScheduleRepository petOrderScheduleRepository,
        PetOrderLogRepository petOrderLogRepository, ServiceRecordRepository serviceRecordRepository) {
        this.petOrderRepository = petOrderRepository;
        this.petOrderPetRepository = petOrderPetRepository;
        this.petOrderScheduleRepository = petOrderScheduleRepository;
        this.petOrderLogRepository = petOrderLogRepository;
        this.serviceRecordRepository = serviceRecordRepository;
    }

    public List<SitterAvailableOrderItemResponse> availableOrders(SitterOrderListRequest request) {
        if (request.getSitterId() == null) {
            throw new RuntimeException("服务者ID不能为空");
        }

        BigDecimal sitterLat = request.getLatitude();
        BigDecimal sitterLng = request.getLongitude();

        List<PetOrder> orders = petOrderRepository.findByOrderStatusAndDeletedOrderByIdDesc("WAIT_TAKING", 0);
        if (orders.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> orderIds = orders.stream().map(PetOrder::getId).collect(Collectors.toList());
        List<PetOrderSchedule> schedules = petOrderScheduleRepository.findByOrderIdInOrderByServiceDateAsc(orderIds);

        Map<Long, List<PetOrderSchedule>> scheduleMap = schedules.stream()
            .collect(Collectors.groupingBy(PetOrderSchedule::getOrderId));

        List<SitterAvailableOrderItemResponse> result = new ArrayList<>();

        for (PetOrder order : orders) {
            List<PetOrderSchedule> currentSchedules = scheduleMap.getOrDefault(order.getId(), new ArrayList<>());

            SitterAvailableOrderItemResponse item = new SitterAvailableOrderItemResponse();
            item.setId(order.getId());
            item.setOrderNo(order.getOrderNo());
            item.setOrderStatus(order.getOrderStatus());
            item.setPetCount(order.getPetCount());
            item.setServiceDateCount(order.getServiceDateCount());
            item.setServiceDurationMinutes(order.getServiceDurationMinutes());
            item.setServiceProvince(order.getServiceProvince());
            item.setServiceCity(order.getServiceCity());
            item.setServiceDistrict(order.getServiceDistrict());
            item.setServiceDetailAddress(order.getServiceDetailAddress());
            item.setUnitPrice(order.getUnitPrice());
            item.setTotalPrice(order.getTotalPrice());
            item.setRemark(order.getRemark());
            item.setTimeSlots(parseJsonList(order.getTimeSlotsJson()));
            item.setServiceDates(currentSchedules.stream()
                .map(s -> s.getServiceDate().toString())
                .collect(Collectors.toList()));
            item.setDistanceKm(calculateDistanceKm(
                sitterLat,
                sitterLng,
                order.getServiceLatitude(),
                order.getServiceLongitude()
            ));

            result.add(item);
        }

        return result;
    }

    public List<SitterMyOrderItemResponse> myOrders(SitterOrderListRequest request) {
        if (request.getSitterId() == null) {
            throw new RuntimeException("服务者ID不能为空");
        }

        BigDecimal sitterLat = request.getLatitude();
        BigDecimal sitterLng = request.getLongitude();

        List<PetOrder> orders = petOrderRepository.findBySitterIdAndDeletedOrderByIdDesc(request.getSitterId(), 0);
        if (orders.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> orderIds = orders.stream().map(PetOrder::getId).collect(Collectors.toList());
        List<PetOrderSchedule> schedules = petOrderScheduleRepository.findByOrderIdInOrderByServiceDateAsc(orderIds);

        Map<Long, List<PetOrderSchedule>> scheduleMap = schedules.stream()
            .collect(Collectors.groupingBy(PetOrderSchedule::getOrderId));

        List<SitterMyOrderItemResponse> result = new ArrayList<>();

        for (PetOrder order : orders) {
            List<PetOrderSchedule> currentSchedules = scheduleMap.getOrDefault(order.getId(), new ArrayList<>());
            String firstServiceDate = currentSchedules.isEmpty() ? "" : currentSchedules.get(0).getServiceDate().toString();

            SitterMyOrderItemResponse item = new SitterMyOrderItemResponse();
            item.setId(order.getId());
            item.setOrderNo(order.getOrderNo());
            item.setOrderStatus(order.getOrderStatus());
            item.setPetCount(order.getPetCount());
            item.setServiceDateCount(order.getServiceDateCount());
            item.setServiceDurationMinutes(order.getServiceDurationMinutes());
            item.setServiceProvince(order.getServiceProvince());
            item.setServiceCity(order.getServiceCity());
            item.setServiceDistrict(order.getServiceDistrict());
            item.setServiceDetailAddress(order.getServiceDetailAddress());
            item.setUnitPrice(order.getUnitPrice());
            item.setTotalPrice(order.getTotalPrice());
            item.setRemark(order.getRemark());
            item.setTimeSlots(parseJsonList(order.getTimeSlotsJson()));
            item.setFirstServiceDate(firstServiceDate);
            item.setDistanceKm(calculateDistanceKm(
                sitterLat,
                sitterLng,
                order.getServiceLatitude(),
                order.getServiceLongitude()
            ));

            result.add(item);
        }

        return result;
    }

    private Double calculateDistanceKm(BigDecimal lat1, BigDecimal lng1, BigDecimal lat2, BigDecimal lng2) {
        if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) {
            return null;
        }

        double earthRadius = 6371.0;

        double lat1Rad = Math.toRadians(lat1.doubleValue());
        double lng1Rad = Math.toRadians(lng1.doubleValue());
        double lat2Rad = Math.toRadians(lat2.doubleValue());
        double lng2Rad = Math.toRadians(lng2.doubleValue());

        double deltaLat = lat2Rad - lat1Rad;
        double deltaLng = lng2Rad - lng1Rad;

        double a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
            + Math.cos(lat1Rad) * Math.cos(lat2Rad)
            * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        double distance = earthRadius * c;

        return Math.round(distance * 10.0) / 10.0;
    }

    public SitterOrderDetailResponse detail(Long id, Long sitterId) {
        PetOrder order = petOrderRepository.findByIdAndDeleted(id, 0)
            .orElseThrow(() -> new RuntimeException("订单不存在"));

        // 待接单时允许任意服务者看详情；已接单后只允许接单人查看
        if (!"WAIT_TAKING".equals(order.getOrderStatus())) {
            if (order.getSitterId() == null || !order.getSitterId().equals(sitterId)) {
                throw new RuntimeException("无权查看该订单");
            }
        }

        List<PetOrderPet> orderPets = petOrderPetRepository.findByOrderId(order.getId());
        List<PetOrderSchedule> schedules = petOrderScheduleRepository.findByOrderIdOrderByServiceDateAsc(order.getId());

        SitterOrderDetailResponse response = new SitterOrderDetailResponse();
        response.setId(order.getId());
        response.setOrderNo(order.getOrderNo());
        response.setUserId(order.getUserId());
        response.setOrderStatus(order.getOrderStatus());
        response.setPetCount(order.getPetCount());
        response.setServiceDateCount(order.getServiceDateCount());
        response.setServiceDurationMinutes(order.getServiceDurationMinutes());
        response.setServiceContactName(order.getServiceContactName());
        response.setServiceContactPhone(order.getServiceContactPhone());
        response.setServiceFullAddress(
            safe(order.getServiceProvince()) +
                safe(order.getServiceCity()) +
                safe(order.getServiceDistrict()) +
                safe(order.getServiceDetailAddress())
        );
        response.setUnitPrice(order.getUnitPrice());
        response.setTotalPrice(order.getTotalPrice());
        response.setRemark(order.getRemark());
        response.setTimeSlots(parseJsonList(order.getTimeSlotsJson()));
        response.setPets(orderPets.stream().map(this::toPetResponse).collect(Collectors.toList()));
        response.setServiceDates(schedules.stream().map(this::toScheduleResponse).collect(Collectors.toList()));
        return response;
    }

    @Transactional
    public void takeOrder(TakeOrderRequest request) {
        validateOperator(request.getOrderId(), request.getSitterId());

        PetOrder order = petOrderRepository.findByIdAndDeleted(request.getOrderId(), 0)
            .orElseThrow(() -> new RuntimeException("订单不存在"));

        if (!"WAIT_TAKING".equals(order.getOrderStatus())) {
            throw new RuntimeException("该订单已不可接");
        }

        order.setOrderStatus("TAKEN");
        order.setSitterId(request.getSitterId());
        order.setTakenAt(LocalDateTime.now());
        petOrderRepository.save(order);

        writeLog(order.getId(), "TAKE_ORDER", "SITTER", request.getSitterId(), "服务者接单");
    }

    @Transactional
    public void startService(StartServiceRequest request) {
        validateOperator(request.getOrderId(), request.getSitterId());

        PetOrder order = petOrderRepository.findByIdAndSitterIdAndDeleted(request.getOrderId(), request.getSitterId(), 0)
            .orElseThrow(() -> new RuntimeException("订单不存在"));

        if (!"TAKEN".equals(order.getOrderStatus())) {
            throw new RuntimeException("当前状态不可开始服务");
        }

        order.setOrderStatus("SERVING");
        order.setServiceStartedAt(LocalDateTime.now());
        petOrderRepository.save(order);

        List<PetOrderSchedule> schedules = petOrderScheduleRepository.findByOrderIdOrderByServiceDateAsc(order.getId());
        for (PetOrderSchedule item : schedules) {
            if ("PENDING".equals(item.getScheduleStatus())) {
                item.setScheduleStatus("SERVING");
            }
        }
        petOrderScheduleRepository.saveAll(schedules);

        writeLog(order.getId(), "START_SERVICE", "SITTER", request.getSitterId(), "服务者开始服务");
    }

    @Transactional
    public void startSchedule(StartScheduleRequest request) {
        validateScheduleRequest(request.getOrderId(), request.getScheduleId(), request.getSitterId());

        PetOrder order = petOrderRepository.findByIdAndSitterIdAndDeleted(
            request.getOrderId(), request.getSitterId(), 0
        ).orElseThrow(() -> new RuntimeException("订单不存在"));

        if ("WAIT_TAKING".equals(order.getOrderStatus())) {
            throw new RuntimeException("请先接单");
        }

        if ("CANCELLED".equals(order.getOrderStatus()) || "COMPLETED".equals(order.getOrderStatus())) {
            throw new RuntimeException("当前订单状态不可开始服务");
        }

        PetOrderSchedule schedule = petOrderScheduleRepository.findByIdAndOrderId(
            request.getScheduleId(), request.getOrderId()
        ).orElseThrow(() -> new RuntimeException("服务日程不存在"));

        if (!"PENDING".equals(schedule.getScheduleStatus())) {
            throw new RuntimeException("当前服务日程不可开始");
        }

        if (!isToday(schedule.getServiceDate())) {
            throw new RuntimeException("未到服务日期，暂不能开始");
        }

        if (petOrderScheduleRepository.existsByOrderIdAndScheduleStatus(order.getId(), "SERVING")) {
            throw new RuntimeException("当前已有进行中的服务，请先完成后再开始新的服务");
        }

        Integer distanceMeters = calculateDistanceMeters(
            request.getLatitude(),
            request.getLongitude(),
            order.getServiceLatitude(),
            order.getServiceLongitude()
        );

        if (distanceMeters == null) {
            throw new RuntimeException("无法获取当前位置，请开启定位后重试");
        }

        if (distanceMeters > 300) {
            throw new RuntimeException("你当前不在服务地址附近，暂不能开始服务");
        }

        schedule.setScheduleStatus("SERVING");
        schedule.setStartTime(LocalDateTime.now());
        schedule.setStartLatitude(request.getLatitude());
        schedule.setStartLongitude(request.getLongitude());
        schedule.setStartDistanceMeters(distanceMeters);

        petOrderScheduleRepository.save(schedule);

        recalculateOrderStatus(order);

        writeLog(order.getId(), "START_SCHEDULE", "SITTER", request.getSitterId(), "开始本次服务");
    }



    private void validateScheduleRequest(Long orderId, Long scheduleId, Long sitterId) {
        if (orderId == null) {
            throw new RuntimeException("订单ID不能为空");
        }
        if (scheduleId == null) {
            throw new RuntimeException("服务日程ID不能为空");
        }
        if (sitterId == null) {
            throw new RuntimeException("服务者ID不能为空");
        }
    }

    private boolean isToday(java.time.LocalDate serviceDate) {
        return serviceDate != null && java.time.LocalDate.now().equals(serviceDate);
    }

    private Integer calculateDistanceMeters(BigDecimal lat1, BigDecimal lng1, BigDecimal lat2, BigDecimal lng2) {
        if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) {
            return null;
        }

        double earthRadius = 6371000.0;

        double lat1Rad = Math.toRadians(lat1.doubleValue());
        double lng1Rad = Math.toRadians(lng1.doubleValue());
        double lat2Rad = Math.toRadians(lat2.doubleValue());
        double lng2Rad = Math.toRadians(lng2.doubleValue());

        double deltaLat = lat2Rad - lat1Rad;
        double deltaLng = lng2Rad - lng1Rad;

        double a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
            + Math.cos(lat1Rad) * Math.cos(lat2Rad)
            * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return (int) Math.round(earthRadius * c);
    }


    @Transactional
    public void finishSchedule(FinishScheduleRequest request) {
        validateScheduleRequest(request.getOrderId(), request.getScheduleId(), request.getSitterId());

        PetOrder order = petOrderRepository.findByIdAndSitterIdAndDeleted(
            request.getOrderId(), request.getSitterId(), 0
        ).orElseThrow(() -> new RuntimeException("订单不存在"));

        if ("CANCELLED".equals(order.getOrderStatus()) || "COMPLETED".equals(order.getOrderStatus())) {
            throw new RuntimeException("当前订单状态不可结束服务");
        }

        PetOrderSchedule schedule = petOrderScheduleRepository.findByIdAndOrderId(
            request.getScheduleId(), request.getOrderId()
        ).orElseThrow(() -> new RuntimeException("服务日程不存在"));

        if (!"SERVING".equals(schedule.getScheduleStatus()) && !"RECORDED".equals(schedule.getScheduleStatus())) {
            throw new RuntimeException("当前服务日程不可结束");
        }

        if (!serviceRecordRepository.existsByOrderIdAndScheduleId(request.getOrderId(), request.getScheduleId())) {
            throw new RuntimeException("请先填写并提交服务记录");
        }

        Integer distanceMeters = calculateDistanceMeters(
            request.getLatitude(),
            request.getLongitude(),
            order.getServiceLatitude(),
            order.getServiceLongitude()
        );

        if (distanceMeters == null) {
            throw new RuntimeException("无法获取当前位置，请开启定位后重试");
        }

        schedule.setScheduleStatus("DONE");
        schedule.setFinishTime(LocalDateTime.now());
        schedule.setFinishLatitude(request.getLatitude());
        schedule.setFinishLongitude(request.getLongitude());
        schedule.setFinishDistanceMeters(distanceMeters);

        petOrderScheduleRepository.save(schedule);

        recalculateOrderStatus(order);

        writeLog(order.getId(), "FINISH_SCHEDULE", "SITTER", request.getSitterId(), "结束本次服务");
    }



    private void recalculateOrderStatus(PetOrder order) {
        List<PetOrderSchedule> schedules = petOrderScheduleRepository.findByOrderIdOrderByServiceDateAsc(order.getId());
        if (schedules == null || schedules.isEmpty()) {
            return;
        }

        long total = schedules.size();
        long pendingCount = schedules.stream().filter(s -> "PENDING".equals(s.getScheduleStatus())).count();
        long servingCount = schedules.stream().filter(s -> "SERVING".equals(s.getScheduleStatus())).count();
        long recordedCount = schedules.stream().filter(s -> "RECORDED".equals(s.getScheduleStatus())).count();
        long doneCount = schedules.stream().filter(s -> "DONE".equals(s.getScheduleStatus())).count();
        long cancelledCount = schedules.stream().filter(s -> "CANCELLED".equals(s.getScheduleStatus())).count();

        String newStatus;

        if (cancelledCount == total) {
            newStatus = "CANCELLED";
        } else if (doneCount == total) {
            newStatus = "COMPLETED";
        } else if (servingCount > 0 || recordedCount > 0) {
            newStatus = "PART_SERVING";
        } else if (doneCount > 0) {
            newStatus = "PART_COMPLETED";
        } else {
            newStatus = "TAKEN";
        }

        order.setOrderStatus(newStatus);

        if ("COMPLETED".equals(newStatus)) {
            order.setServiceCompletedAt(LocalDateTime.now());
        }

        petOrderRepository.save(order);
    }

    private void validateScheduleOperator(Long orderId, Long scheduleId, Long sitterId) {
        if (orderId == null) {
            throw new RuntimeException("订单ID不能为空");
        }
        if (scheduleId == null) {
            throw new RuntimeException("服务日程ID不能为空");
        }
        if (sitterId == null) {
            throw new RuntimeException("服务者ID不能为空");
        }
    }
    @Transactional
    public void completeService(CompleteServiceRequest request) {
        validateOperator(request.getOrderId(), request.getSitterId());

        PetOrder order = petOrderRepository.findByIdAndSitterIdAndDeleted(request.getOrderId(), request.getSitterId(), 0)
            .orElseThrow(() -> new RuntimeException("订单不存在"));

        if (!"SERVING".equals(order.getOrderStatus())) {
            throw new RuntimeException("当前状态不可完成服务");
        }

        order.setOrderStatus("COMPLETED");
        order.setServiceCompletedAt(LocalDateTime.now());
        petOrderRepository.save(order);

        List<PetOrderSchedule> schedules = petOrderScheduleRepository.findByOrderIdOrderByServiceDateAsc(order.getId());
        for (PetOrderSchedule item : schedules) {
            if (!"CANCELLED".equals(item.getScheduleStatus())) {
                item.setScheduleStatus("DONE");
            }
        }
        petOrderScheduleRepository.saveAll(schedules);

        writeLog(order.getId(), "COMPLETE_SERVICE", "SITTER", request.getSitterId(), "服务者完成服务");
    }

    private void validateOperator(Long orderId, Long sitterId) {
        if (orderId == null) {
            throw new RuntimeException("订单ID不能为空");
        }
        if (sitterId == null) {
            throw new RuntimeException("服务者ID不能为空");
        }
    }

    private void writeLog(Long orderId, String action, String operatorType, Long operatorId, String remark) {
        PetOrderLog log = new PetOrderLog();
        log.setOrderId(orderId);
        log.setAction(action);
        log.setOperatorType(operatorType);
        log.setOperatorId(operatorId);
        log.setRemark(remark);
        petOrderLogRepository.save(log);
    }

    private String safe(String str) {
        return str == null ? "" : str;
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

    private OrderPetItemResponse toPetResponse(PetOrderPet item) {
        OrderPetItemResponse response = new OrderPetItemResponse();
        response.setPetId(item.getPetId());
        response.setPetName(item.getPetName());
        response.setPetType(item.getPetType());
        response.setPetBreed(item.getPetBreed());
        response.setPetImageUrl(item.getPetImageUrl());
        return response;
    }

    private OrderScheduleItemResponse toScheduleResponse(PetOrderSchedule item) {
        OrderScheduleItemResponse response = new OrderScheduleItemResponse();
        response.setServiceDate(item.getServiceDate().toString());
        response.setScheduleStatus(item.getScheduleStatus());
        response.setTimeSlots(parseJsonList(item.getTimeSlotsJson()));
        response.setServiceDurationMinutes(item.getServiceDurationMinutes());
        response.setScheduleId(item.getId());
        response.setServiceDate(item.getServiceDate().toString());
        response.setScheduleStatus(item.getScheduleStatus());
        response.setTimeSlots(parseJsonList(item.getTimeSlotsJson()));
        response.setServiceDurationMinutes(item.getServiceDurationMinutes());
        return response;
    }
}