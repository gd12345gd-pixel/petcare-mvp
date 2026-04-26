package com.example.petcare.service;
import java.util.function.Function;
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
    private final ServiceRecordRepository serviceRecordRepository;
    private final SitterProfileRepository sitterProfileRepository;
    private final OrderRemarkService orderRemarkService;
    private final ReviewService reviewService;
    private final ReviewRepository reviewRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public OrderService(PetOrderRepository petOrderRepository,
                        PetOrderPetRepository petOrderPetRepository,
                        PetOrderScheduleRepository petOrderScheduleRepository,
                        PetOrderLogRepository petOrderLogRepository,
                        UserAddressRepository userAddressRepository,
                        PetRepository petRepository,
                        ServiceRecordRepository serviceRecordRepository,
                        SitterProfileRepository sitterProfileRepository,
                        OrderRemarkService orderRemarkService,
                        ReviewService reviewService,
                        ReviewRepository reviewRepository) {
        this.petOrderRepository = petOrderRepository;
        this.petOrderPetRepository = petOrderPetRepository;
        this.petOrderScheduleRepository = petOrderScheduleRepository;
        this.petOrderLogRepository = petOrderLogRepository;
        this.userAddressRepository = userAddressRepository;
        this.petRepository = petRepository;
        this.serviceRecordRepository = serviceRecordRepository;
        this.sitterProfileRepository = sitterProfileRepository;
        this.orderRemarkService = orderRemarkService;
        this.reviewService = reviewService;
        this.reviewRepository = reviewRepository;
    }
    @Transactional
    public CreateOrderResponse createOrder(CreateOrderRequest request) {
        validateCreateRequest(request);
        PetOrder savedOrder = createOrderInternal(request, null, 0, "MINI_APP", "CREATE_ORDER", "用户创建订单");
        return toCreateOrderResponse(savedOrder);
    }

    @Transactional
    public RescheduleOrderResponse rescheduleOrder(Long originalOrderId, CreateOrderRequest request) {
        if (originalOrderId == null) {
            throw new RuntimeException("原订单ID不能为空");
        }
        validateCreateRequest(request);

        PetOrder oldOrder = petOrderRepository.findByIdAndUserIdAndDeleted(originalOrderId, request.getUserId(), 0)
                .orElseThrow(() -> new RuntimeException("原订单不存在"));

        validateRescheduleAllowed(oldOrder);

        int nextRescheduleCount = safeCount(oldOrder.getRescheduleCount()) + 1;
        PetOrder newOrder = createOrderInternal(
                request,
                resolveRootOrderId(oldOrder),
                nextRescheduleCount,
                "RESCHEDULE",
                "RESCHEDULE_CREATE",
                "用户修改预约生成新订单，原订单号：" + oldOrder.getOrderNo()
        );

        oldOrder.setOrderStatus("CANCELLED");
        oldOrder.setCancelReason("用户修改预约");
        petOrderRepository.save(oldOrder);

        List<PetOrderSchedule> oldSchedules = petOrderScheduleRepository.findByOrderIdOrderByServiceDateAsc(oldOrder.getId());
        for (PetOrderSchedule item : oldSchedules) {
            item.setScheduleStatus("CANCELLED");
        }
        petOrderScheduleRepository.saveAll(oldSchedules);

        saveOrderLog(oldOrder.getId(), "RESCHEDULE_CANCEL", "USER", request.getUserId(),
                "用户修改预约，关闭旧订单，新订单号：" + newOrder.getOrderNo());

        return toRescheduleResponse(oldOrder, newOrder);
    }

    private PetOrder createOrderInternal(CreateOrderRequest request,
                                         Long originalOrderId,
                                         int rescheduleCount,
                                         String source,
                                         String logAction,
                                         String logRemark) {
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

        BigDecimal unitPrice = calculateSuggestedUnitPrice(
                pets.size(),
                request.getServiceDurationMinutes(),
                request.getTimeSlots()
        );
        BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(request.getServiceDates().size()))
                .setScale(2, RoundingMode.HALF_UP);

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

        order.setSuggestedUnitPrice(unitPrice);
        order.setUnitPrice(unitPrice);
        order.setTotalPrice(totalPrice);
        order.setSource(source);
        order.setOriginalOrderId(originalOrderId);
        order.setRescheduleCount(rescheduleCount);
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

        saveOrderLog(savedOrder.getId(), logAction, "USER", request.getUserId(), logRemark);

        return savedOrder;
    }
    public OrderDetailResponse detail(Long id, Long userId) {
        PetOrder order = petOrderRepository.findByIdAndUserIdAndDeleted(id, userId, 0)
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        List<PetOrderPet> orderPets = petOrderPetRepository.findByOrderId(order.getId());
        List<PetOrderSchedule> schedules = petOrderScheduleRepository.findByOrderIdOrderByServiceDateAsc(order.getId());
        Map<Long, Long> recordIdMap = serviceRecordRepository.findByOrderIdOrderBySubmittedAtDesc(order.getId())
                .stream()
                .filter(record -> record.getScheduleId() != null)
                .collect(Collectors.toMap(
                        ServiceRecord::getScheduleId,
                        ServiceRecord::getId,
                        (first, second) -> first
                ));

        OrderDetailResponse response = new OrderDetailResponse();
        response.setId(order.getId());
        response.setOrderNo(order.getOrderNo());
        response.setOrderStatus(order.getOrderStatus());
        response.setPayStatus(order.getPayStatus());
        response.setCreatedAt(order.getCreatedAt() == null ? "" : order.getCreatedAt().toString());
        response.setTakenAt(order.getTakenAt() == null ? "" : order.getTakenAt().toString());
        response.setSitterId(order.getSitterId());
        response.setAddressId(order.getAddressId());
        response.setCanReschedule(canReschedule(order, schedules));
        response.setRescheduleCount(safeCount(order.getRescheduleCount()));
        if (order.getSitterId() != null) {
            sitterProfileRepository.findById(order.getSitterId()).ifPresent(sitter -> {
                response.setSitterName(safe(sitter.getRealName()));
                response.setSitterPhone(safe(sitter.getPhone()));
            });
        }

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
        response.setServiceDates(schedules.stream().map(item -> toScheduleResponse(item, recordIdMap)).collect(Collectors.toList()));
        response.setRemarkTimeline(orderRemarkService.timeline(order));
        response.setCanAppendRemark(orderRemarkService.canAppendRemark(order.getOrderStatus()));
        ReviewResponse review = reviewService.findByOrder(order.getId(), userId);
        boolean reviewed = review != null;
        response.setReview(review);
        response.setReviewed(reviewed);
        response.setCanReview("COMPLETED".equals(order.getOrderStatus()) && !reviewed && order.getSitterId() != null);

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
        List<PetOrderPet> orderPets = petOrderPetRepository.findByOrderIdIn(orderIds);

        Map<Long, List<PetOrderSchedule>> scheduleMap = schedules.stream()
                .collect(Collectors.groupingBy(PetOrderSchedule::getOrderId));
        Map<Long, List<PetOrderPet>> petMap = orderPets.stream()
                .collect(Collectors.groupingBy(PetOrderPet::getOrderId));

        List<Long> allPetIds = orderPets.stream()
                .map(PetOrderPet::getPetId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, String> petAvatarById = new HashMap<>();
        if (!allPetIds.isEmpty()) {
            petRepository.findAllById(allPetIds).forEach(p -> {
                if (p.getDeleted() == null || p.getDeleted() == 0) {
                    String av = p.getAvatarUrl();
                    if (av != null && !av.trim().isEmpty()) {
                        petAvatarById.put(p.getId(), av);
                    }
                }
            });
        }

        List<OrderListItemResponse> result = new ArrayList<>();

        for (PetOrder order : orders) {
            List<PetOrderSchedule> currentSchedules = scheduleMap.getOrDefault(order.getId(), new ArrayList<>());
            List<PetOrderPet> currentPets = petMap.getOrDefault(order.getId(), new ArrayList<>());
            String firstServiceDate = currentSchedules.isEmpty() ? "" : currentSchedules.get(0).getServiceDate().toString();
            String lastServiceDate = currentSchedules.isEmpty()
                    ? ""
                    : currentSchedules.get(currentSchedules.size() - 1).getServiceDate().toString();
            int completedServiceCount = (int) currentSchedules.stream()
                    .filter(schedule -> "DONE".equals(schedule.getScheduleStatus()))
                    .count();
            int catCount = (int) currentPets.stream()
                    .filter(pet -> isCatType(pet.getPetType()))
                    .count();
            int dogCount = (int) currentPets.stream()
                    .filter(pet -> isDogType(pet.getPetType()))
                    .count();

            OrderListItemResponse item = new OrderListItemResponse();
            item.setId(order.getId());
            item.setOrderNo(order.getOrderNo());
            item.setOrderStatus(order.getOrderStatus());
            item.setPayStatus(order.getPayStatus());
            item.setPetCount(order.getPetCount());
            item.setCatCount(catCount);
            item.setDogCount(dogCount);
            item.setServiceDateCount(order.getServiceDateCount());
            item.setCompletedServiceCount(completedServiceCount);
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
            item.setLastServiceDate(lastServiceDate);
            item.setServiceDates(currentSchedules.stream()
                .map(s -> s.getServiceDate().toString())
                .collect(Collectors.toList()));
            item.setCreatedAt(order.getCreatedAt() == null ? "" : order.getCreatedAt().toString());
            boolean canReschedule = canReschedule(order, currentSchedules);
            item.setCanReschedule(canReschedule);
            item.setRescheduleHint(canReschedule ? "待接单 · 可修改预约" : "");
            boolean reviewed = reviewRepository.existsByOrderIdAndUserId(order.getId(), userId);
            item.setReviewed(reviewed);
            item.setCanReview("COMPLETED".equals(order.getOrderStatus()) && !reviewed && order.getSitterId() != null);
            item.setPetImageUrl(resolveListPetCoverImage(currentPets, petAvatarById));

            enrichOrderListViewFields(item, currentSchedules, order.getOrderStatus());

            result.add(item);
        }

        return result;
    }

    /**
     * 订单列表卡片头像：优先 pet_order_pet 快照，否则用宠物表头像（兼容旧数据未写入快照）。
     */
    private String resolveListPetCoverImage(List<PetOrderPet> pets, Map<Long, String> petAvatarById) {
        if (pets == null || pets.isEmpty()) {
            return "";
        }
        for (PetOrderPet p : pets) {
            if (p.getPetImageUrl() != null && !p.getPetImageUrl().trim().isEmpty()) {
                return p.getPetImageUrl().trim();
            }
        }
        for (PetOrderPet p : pets) {
            String av = petAvatarById.get(p.getPetId());
            if (av != null && !av.trim().isEmpty()) {
                return av.trim();
            }
        }
        return "";
    }

    private void enrichOrderListViewFields(OrderListItemResponse item, List<PetOrderSchedule> schedules, String orderStatus) {
        LocalDate today = LocalDate.now();
        if (schedules == null) {
            schedules = Collections.emptyList();
        }

        if ("WAIT_TAKING".equals(orderStatus) || "CANCELLED".equals(orderStatus)) {
            item.setTodayServiceLabel("");
        } else {
            List<PetOrderSchedule> todaySch = schedules.stream()
                .filter(s -> today.equals(s.getServiceDate()))
                .toList();

            boolean servingToday = todaySch.stream().anyMatch(s ->
                "SERVING".equals(s.getScheduleStatus()) || "RECORDED".equals(s.getScheduleStatus()));
            boolean pendingToday = todaySch.stream().anyMatch(s -> "PENDING".equals(s.getScheduleStatus()));
            boolean doneToday = todaySch.stream().anyMatch(s -> "DONE".equals(s.getScheduleStatus()));

            if (servingToday) {
                item.setTodayServiceLabel("今日服务中");
            } else if (pendingToday) {
                item.setTodayServiceLabel("待托托师上门");
            } else if (doneToday) {
                item.setTodayServiceLabel("今日已完成");
            } else {
                item.setTodayServiceLabel("");
            }
        }

        schedules.stream()
            .filter(s -> !"DONE".equals(s.getScheduleStatus()) && !"CANCELLED".equals(s.getScheduleStatus()))
            .map(PetOrderSchedule::getServiceDate)
            .filter(d -> d.isAfter(today))
            .min(Comparator.naturalOrder())
            .ifPresentOrElse(d -> item.setNextPendingServiceDate(d.toString()), () -> item.setNextPendingServiceDate(""));
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
        order.setCancelReason(isBlank(request.getReason()) ? "用户取消订单" : request.getReason());
        petOrderRepository.save(order);

        List<PetOrderSchedule> schedules = petOrderScheduleRepository.findByOrderIdOrderByServiceDateAsc(order.getId());
        for (PetOrderSchedule item : schedules) {
            item.setScheduleStatus("CANCELLED");
        }
        petOrderScheduleRepository.saveAll(schedules);

        saveOrderLog(order.getId(), "CANCEL_ORDER", "USER", request.getUserId(),
                isBlank(request.getReason()) ? "用户取消订单" : request.getReason());
    }

    private boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }

    private boolean isCatType(String petType) {
        return petType != null && (petType.contains("猫") || "CAT".equalsIgnoreCase(petType));
    }

    private boolean isDogType(String petType) {
        return petType != null && (petType.contains("狗") || "DOG".equalsIgnoreCase(petType));
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
        if (request.getTimeSlots().contains("不限") && request.getTimeSlots().size() > 1) {
            throw new RuntimeException("选择“时间不限”时不能再选其他时间段");
        }
    }

    private BigDecimal calculateSuggestedUnitPrice(int petCount, Integer durationMinutes, List<String> timeSlots) {
        int price = 49;

        if (durationMinutes != null && durationMinutes >= 40) price += 10;
        if (durationMinutes != null && durationMinutes >= 60) price += 10;
        if (durationMinutes != null && durationMinutes >= 90) price += 10;

        if (petCount > 1) {
            price += (petCount - 1) * 10;
        }

        List<String> slots = timeSlots == null ? new ArrayList<>() : timeSlots;
        long concreteSlotCount = slots.stream().filter(slot -> !"不限".equals(slot)).count();
        if (concreteSlotCount > 1) {
            price += (int) (concreteSlotCount - 1) * 5;
        }
        boolean hasLateSlot = slots.stream().anyMatch(slot -> slot != null && slot.startsWith("20:00"));
        if (hasLateSlot) {
            price += 10;
        }

        return BigDecimal.valueOf(price).setScale(2, RoundingMode.HALF_UP);
    }

    private void validateRescheduleAllowed(PetOrder order) {
        if (!"WAIT_TAKING".equals(order.getOrderStatus())) {
            throw new RuntimeException("只有待接单状态的订单允许修改预约");
        }
    }

    private boolean canReschedule(PetOrder order, List<PetOrderSchedule> schedules) {
        return "WAIT_TAKING".equals(order.getOrderStatus());
    }

    private Long resolveRootOrderId(PetOrder oldOrder) {
        return oldOrder.getOriginalOrderId() == null ? oldOrder.getId() : oldOrder.getOriginalOrderId();
    }

    private int safeCount(Integer count) {
        return count == null ? 0 : count;
    }

    private CreateOrderResponse toCreateOrderResponse(PetOrder savedOrder) {
        CreateOrderResponse response = new CreateOrderResponse();
        response.setId(savedOrder.getId());
        response.setOrderNo(savedOrder.getOrderNo());
        response.setOrderStatus(savedOrder.getOrderStatus());
        response.setPayStatus(savedOrder.getPayStatus());
        response.setPetCount(savedOrder.getPetCount());
        response.setServiceDateCount(savedOrder.getServiceDateCount());
        response.setSuggestedUnitPrice(savedOrder.getSuggestedUnitPrice());
        response.setUnitPrice(savedOrder.getUnitPrice());
        response.setTotalPrice(savedOrder.getTotalPrice());
        return response;
    }

    private RescheduleOrderResponse toRescheduleResponse(PetOrder oldOrder, PetOrder newOrder) {
        BigDecimal oldTotal = safeMoney(oldOrder.getTotalPrice());
        BigDecimal newTotal = safeMoney(newOrder.getTotalPrice());
        BigDecimal diff = newTotal.subtract(oldTotal).setScale(2, RoundingMode.HALF_UP);

        RescheduleOrderResponse response = new RescheduleOrderResponse();
        response.setOldOrderId(oldOrder.getId());
        response.setNewOrderId(newOrder.getId());
        response.setNewOrderNo(newOrder.getOrderNo());
        response.setOldTotalPrice(oldTotal);
        response.setNewTotalPrice(newTotal);
        response.setPriceDiff(diff.abs());
        response.setRescheduleCount(safeCount(newOrder.getRescheduleCount()));

        if (diff.compareTo(BigDecimal.ZERO) > 0) {
            response.setPriceChangeType("INCREASE");
            response.setPaymentAction("NEED_PAY_DIFF");
        } else if (diff.compareTo(BigDecimal.ZERO) < 0) {
            response.setPriceChangeType("DECREASE");
            response.setPaymentAction("REFUND_DIFF");
        } else {
            response.setPriceChangeType("UNCHANGED");
            response.setPaymentAction("NONE");
        }

        return response;
    }

    private void saveOrderLog(Long orderId, String action, String operatorType, Long operatorId, String remark) {
        PetOrderLog log = new PetOrderLog();
        log.setOrderId(orderId);
        log.setAction(action);
        log.setOperatorType(operatorType);
        log.setOperatorId(operatorId);
        log.setRemark(remark);
        petOrderLogRepository.save(log);
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
        petRepository.findByIdAndDeleted(item.getPetId(), 0).ifPresent(pet -> enrichPetResponse(response, pet));
        return response;
    }

    private void enrichPetResponse(OrderPetItemResponse response, Pet pet) {
        response.setPetName(firstText(pet.getName(), response.getPetName()));
        response.setPetType(firstText(pet.getType(), response.getPetType()));
        response.setPetBreed(firstText(pet.getBreed(), response.getPetBreed()));
        response.setPetImageUrl(firstText(pet.getAvatarUrl(), response.getPetImageUrl()));
        response.setPetGender(firstText(pet.getGender(), response.getPetGender()));
        response.setPetAge(firstText(pet.getAge(), response.getPetAge()));
        response.setPetRemark(firstText(pet.getIntro(), response.getPetRemark()));
        response.setPetWeight(pet.getWeight());
        response.setPetTags(parseJsonList(pet.getTagsJson()));
        response.setHasAggression(pet.getHasAggression());
        response.setVaccinated(pet.getVaccinated());
        response.setPetIntro(pet.getIntro());
        response.setPetAlbumList(parseJsonList(pet.getAlbumJson()));
    }

    private String firstText(String preferred, String fallback) {
        return preferred == null || preferred.trim().isEmpty() ? fallback : preferred;
    }

    private OrderScheduleItemResponse toScheduleResponse(PetOrderSchedule item) {
        return toScheduleResponse(item, null);
    }

    private OrderScheduleItemResponse toScheduleResponse(PetOrderSchedule item, Map<Long, Long> recordIdMap) {
        OrderScheduleItemResponse response = new OrderScheduleItemResponse();
        response.setScheduleId(item.getId());
        if (recordIdMap != null) {
            response.setRecordId(recordIdMap.get(item.getId()));
        }
        response.setServiceDate(item.getServiceDate().toString());
        response.setScheduleStatus(item.getScheduleStatus());
        response.setTimeSlots(parseJsonList(item.getTimeSlotsJson()));
        response.setServiceDurationMinutes(item.getServiceDurationMinutes());
        return response;
    }
}
