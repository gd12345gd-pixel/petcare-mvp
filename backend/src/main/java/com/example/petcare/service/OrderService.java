package com.example.petcare.service;
import java.util.function.Function;
import java.util.stream.Collectors;
import com.example.petcare.dto.*;
import com.example.petcare.entity.*;
import com.example.petcare.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import com.example.petcare.entity.Pet;
@Service
public class OrderService {

    private final PetOrderRepository petOrderRepository;
    private final PetOrderPetRepository petOrderPetRepository;
    private final PetOrderScheduleRepository petOrderScheduleRepository;
    private final PetOrderLogRepository petOrderLogRepository;
    private final PetRepository petRepository;
    private final UserAddressRepository userAddressRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public OrderService(PetOrderRepository petOrderRepository,
                        PetOrderPetRepository petOrderPetRepository,
                        PetOrderScheduleRepository petOrderScheduleRepository,
                        PetOrderLogRepository petOrderLogRepository,
                        UserAddressRepository userAddressRepository,
                        PetRepository petRepository) {
        this.petOrderRepository = petOrderRepository;
        this.petOrderPetRepository = petOrderPetRepository;
        this.petOrderScheduleRepository = petOrderScheduleRepository;
        this.petOrderLogRepository = petOrderLogRepository;
        this.userAddressRepository = userAddressRepository;
        this.petRepository = petRepository;
    }
    @Transactional
    public CreateOrderResponse createOrder(CreateOrderRequest request) {
        validateCreateRequest(request);

        UserAddress address = userAddressRepository
                .findByIdAndUserIdAndDeleted(request.getAddressId(), request.getUserId(), 0)
                .orElseThrow(() -> new RuntimeException("服务地址不存在"));

        List<Pet> pets = petRepository.findByIdInAndUserIdAndDeleted(
                request.getPetIds(),
                request.getUserId(),
                0
        );

        if (pets.size() != request.getPetIds().size()) {
            throw new RuntimeException("所选宠物不存在或不属于当前用户");
        }

        BigDecimal suggestedUnitPrice = calculateSuggestedUnitPrice(
                request.getPetIds() == null ? 0 : request.getPetIds().size(),
                request.getServiceDurationMinutes()
        );

        BigDecimal unitPrice = safeMoney(request.getServiceFee());
        BigDecimal totalPrice = safeMoney(request.getTotalPrice());

        BigDecimal expectedTotalPrice = unitPrice.multiply(BigDecimal.valueOf(request.getServiceDates().size()))
                .setScale(2, RoundingMode.HALF_UP);

        if (expectedTotalPrice.compareTo(totalPrice) != 0) {
            throw new RuntimeException("总价计算不正确");
        }

        PetOrder order = new PetOrder();
        order.setOrderNo(generateOrderNo());
        order.setUserId(request.getUserId());
        order.setOrderStatus("WAIT_TAKING");
        order.setPayStatus("UNPAID");
        order.setPayType("OFFLINE_CONFIRM");

        order.setAddressId(address.getId());
        order.setServiceContactName(address.getContactName());
        order.setServiceContactPhone(address.getContactPhone());
        order.setServiceProvince(address.getProvince());
        order.setServiceCity(address.getCity());
        order.setServiceDistrict(address.getDistrict());
        order.setServiceDetailAddress(address.getDetailAddress());
        order.setServiceLatitude(address.getLatitude());
        order.setServiceLongitude(address.getLongitude());

        order.setPetCount(request.getPetIds().size());
        order.setServiceDateCount(request.getServiceDates().size());
        order.setServiceDurationMinutes(request.getServiceDurationMinutes());
        order.setTimeSlotsJson(toJson(request.getTimeSlots()));
        order.setRemark(request.getRemark());
        order.setSpecialRequirement(request.getSpecialRequirement());

        order.setSuggestedUnitPrice(suggestedUnitPrice);
        order.setUnitPrice(unitPrice);
        order.setTotalPrice(totalPrice);
        order.setSource("MINI_APP");
        order.setDeleted(0);

        PetOrder savedOrder = petOrderRepository.save(order);

        Map<Long, Pet> petMap = pets.stream()
                .collect(Collectors.toMap(Pet::getId, item -> item));

        for (Long petId : request.getPetIds()) {
            Pet pet = petMap.get(petId);
            if (pet == null) {
                throw new RuntimeException("宠物不存在，ID=" + petId);
            }

            PetOrderPet item = new PetOrderPet();
            item.setOrderId(savedOrder.getId());
            item.setPetId(pet.getId());
            item.setPetName(pet.getName());
            item.setPetType(pet.getType());
            item.setPetBreed(pet.getBreed());
            item.setPetImageUrl(pet.getAvatarUrl());
            item.setPetGender(pet.getGender());
            item.setPetRemark(pet.getIntro());
            item.setPetAge(pet.getAge());
            petOrderPetRepository.save(item);
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (String serviceDate : request.getServiceDates()) {
            PetOrderSchedule schedule = new PetOrderSchedule();
            schedule.setOrderId(savedOrder.getId());
            schedule.setServiceDate(LocalDate.parse(serviceDate, formatter));
            schedule.setTimeSlotsJson(toJson(request.getTimeSlots()));
            schedule.setServiceDurationMinutes(request.getServiceDurationMinutes());
            schedule.setScheduleStatus("PENDING");
            petOrderScheduleRepository.save(schedule);
        }

        PetOrderLog log = new PetOrderLog();
        log.setOrderId(savedOrder.getId());
        log.setAction("CREATE_ORDER");
        log.setOperatorType("USER");
        log.setOperatorId(request.getUserId());
        log.setRemark("用户创建订单");
        petOrderLogRepository.save(log);

        CreateOrderResponse response = new CreateOrderResponse();
        response.setId(savedOrder.getId());
        response.setOrderNo(savedOrder.getOrderNo());
        response.setOrderStatus(savedOrder.getOrderStatus());
        response.setPayStatus(savedOrder.getPayStatus());
        response.setPetCount(savedOrder.getPetCount());
        response.setServiceDateCount(savedOrder.getServiceDateCount());
        response.setUnitPrice(savedOrder.getUnitPrice());
        response.setTotalPrice(savedOrder.getTotalPrice());
        return response;
    }
    public OrderDetailResponse detail(Long id, Long userId) {
        PetOrder order = petOrderRepository.findByIdAndUserIdAndDeleted(id, userId, 0)
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        List<PetOrderPet> orderPets = petOrderPetRepository.findByOrderId(order.getId());
        List<PetOrderSchedule> schedules = petOrderScheduleRepository.findByOrderIdOrderByServiceDateAsc(order.getId());

        OrderDetailResponse response = new OrderDetailResponse();
        response.setId(order.getId());
        response.setOrderNo(order.getOrderNo());
        response.setOrderStatus(order.getOrderStatus());
        response.setPayStatus(order.getPayStatus());

        response.setServiceContactName(order.getServiceContactName());
        response.setServiceContactPhone(order.getServiceContactPhone());
        response.setServiceFullAddress(
                safe(order.getServiceProvince()) +
                        safe(order.getServiceCity()) +
                        safe(order.getServiceDistrict()) +
                        safe(order.getServiceDetailAddress())
        );

        response.setPetCount(order.getPetCount());
        response.setServiceDateCount(order.getServiceDateCount());
        response.setServiceDurationMinutes(order.getServiceDurationMinutes());
        response.setTimeSlots(parseJsonList(order.getTimeSlotsJson()));

        response.setPets(orderPets.stream().map(this::toPetResponse).collect(Collectors.toList()));
        response.setServiceDates(schedules.stream().map(this::toScheduleResponse).collect(Collectors.toList()));

        response.setSuggestedUnitPrice(order.getSuggestedUnitPrice());
        response.setUnitPrice(order.getUnitPrice());
        response.setTotalPrice(order.getTotalPrice());
        response.setRemark(order.getRemark());
        return response;
    }
    public List<OrderListItemResponse> list(Long userId) {
        List<PetOrder> orders = petOrderRepository.findByUserIdAndDeletedOrderByIdDesc(userId, 0);

        if (orders.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> orderIds = orders.stream().map(PetOrder::getId).collect(Collectors.toList());

        List<PetOrderSchedule> schedules = petOrderScheduleRepository.findByOrderIdInOrderByServiceDateAsc(orderIds);

        Map<Long, List<PetOrderSchedule>> scheduleMap = schedules.stream()
                .collect(Collectors.groupingBy(PetOrderSchedule::getOrderId));

        List<OrderListItemResponse> result = new ArrayList<>();

        for (PetOrder order : orders) {
            List<PetOrderSchedule> currentSchedules = scheduleMap.getOrDefault(order.getId(), new ArrayList<>());
            String firstServiceDate = currentSchedules.isEmpty() ? "" : currentSchedules.get(0).getServiceDate().toString();

            OrderListItemResponse item = new OrderListItemResponse();
            item.setId(order.getId());
            item.setOrderNo(order.getOrderNo());
            item.setOrderStatus(order.getOrderStatus());
            item.setPayStatus(order.getPayStatus());
            item.setPetCount(order.getPetCount());
            item.setServiceDateCount(order.getServiceDateCount());
            item.setServiceDurationMinutes(order.getServiceDurationMinutes());
            item.setServiceContactName(order.getServiceContactName());
            item.setServiceContactPhone(order.getServiceContactPhone());
            item.setServiceFullAddress(
                    safe(order.getServiceProvince()) +
                            safe(order.getServiceCity()) +
                            safe(order.getServiceDistrict()) +
                            safe(order.getServiceDetailAddress())
            );
            item.setUnitPrice(order.getUnitPrice());
            item.setTotalPrice(order.getTotalPrice());
            item.setFirstServiceDate(firstServiceDate);

            result.add(item);
        }

        return result;
    }
    @Transactional
    public void cancelOrder(CancelOrderRequest request) {
        if (request.getOrderId() == null) {
            throw new RuntimeException("订单ID不能为空");
        }
        if (request.getUserId() == null) {
            throw new RuntimeException("用户ID不能为空");
        }

        PetOrder order = petOrderRepository.findByIdAndUserIdAndDeleted(request.getOrderId(), request.getUserId(), 0)
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        if (!"WAIT_TAKING".equals(order.getOrderStatus())) {
            throw new RuntimeException("当前订单状态不允许取消");
        }

        order.setOrderStatus("CANCELLED");
        petOrderRepository.save(order);

        List<PetOrderSchedule> schedules = petOrderScheduleRepository.findByOrderIdOrderByServiceDateAsc(order.getId());
        for (PetOrderSchedule item : schedules) {
            item.setScheduleStatus("CANCELLED");
        }
        petOrderScheduleRepository.saveAll(schedules);

        PetOrderLog log = new PetOrderLog();
        log.setOrderId(order.getId());
        log.setAction("CANCEL_ORDER");
        log.setOperatorType("USER");
        log.setOperatorId(request.getUserId());
        log.setRemark(isBlank(request.getReason()) ? "用户取消订单" : request.getReason());
        petOrderLogRepository.save(log);
    }

    private boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }
    private void validateCreateRequest(CreateOrderRequest request) {
        if (request.getUserId() == null) {
            throw new RuntimeException("用户ID不能为空");
        }
        if (request.getAddressId() == null) {
            throw new RuntimeException("地址ID不能为空");
        }
        if (request.getPetIds() == null || request.getPetIds().isEmpty()) {
            throw new RuntimeException("请至少选择一只宠物");
        }
        if (request.getServiceDates() == null || request.getServiceDates().isEmpty()) {
            throw new RuntimeException("请至少选择一个服务日期");
        }
        if (request.getTimeSlots() == null || request.getTimeSlots().isEmpty()) {
            throw new RuntimeException("请选择上门时间段");
        }
        if (request.getServiceDurationMinutes() == null || request.getServiceDurationMinutes() <= 0) {
            throw new RuntimeException("服务时长不正确");
        }
        if (safeMoney(request.getServiceFee()).compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("单次价格不正确");
        }
        if (safeMoney(request.getTotalPrice()).compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("总价不正确");
        }

        if (request.getTimeSlots().contains("不限") && request.getTimeSlots().size() > 1) {
            throw new RuntimeException("选择“时间不限”时不能再选其他时间段");
        }
    }

    private BigDecimal calculateSuggestedUnitPrice(int petCount, Integer durationMinutes) {
        int price = 49;

        if (durationMinutes != null && durationMinutes >= 40) price += 10;
        if (durationMinutes != null && durationMinutes >= 60) price += 10;
        if (durationMinutes != null && durationMinutes >= 90) price += 10;

        if (petCount > 1) {
            price += (petCount - 1) * 10;
        }

        return BigDecimal.valueOf(price).setScale(2, RoundingMode.HALF_UP);
    }

    private String generateOrderNo() {
        return "MH" + System.currentTimeMillis();
    }

    private BigDecimal safeMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
    }

    private String safe(String str) {
        return str == null ? "" : str;
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

    private OrderPetItemResponse toPetResponse(PetOrderPet item) {
        OrderPetItemResponse response = new OrderPetItemResponse();
        response.setPetId(item.getPetId());
        response.setPetName(item.getPetName());
        response.setPetType(item.getPetType());
        response.setPetBreed(item.getPetBreed());
        response.setPetImageUrl(item.getPetImageUrl());
        response.setPetGender(item.getPetGender());
        response.setPetAge(item.getPetAge());
        response.setPetRemark(item.getPetRemark());
        return response;
    }

    private OrderScheduleItemResponse toScheduleResponse(PetOrderSchedule item) {
        OrderScheduleItemResponse response = new OrderScheduleItemResponse();
        response.setServiceDate(item.getServiceDate().toString());
        response.setScheduleStatus(item.getScheduleStatus());
        response.setTimeSlots(parseJsonList(item.getTimeSlotsJson()));
        response.setServiceDurationMinutes(item.getServiceDurationMinutes());
        return response;
    }
}