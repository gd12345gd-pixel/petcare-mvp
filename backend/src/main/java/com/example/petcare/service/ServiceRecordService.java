package com.example.petcare.service;

import com.example.petcare.dto.ServiceRecordCreateRequest;
import com.example.petcare.dto.ServiceRecordDetailResponse;
import com.example.petcare.dto.ServiceRecordListItemResponse;
import com.example.petcare.entity.PetOrder;
import com.example.petcare.entity.PetOrderLog;
import com.example.petcare.entity.PetOrderSchedule;
import com.example.petcare.entity.ServiceRecord;
import com.example.petcare.entity.ServiceRecordImage;
import com.example.petcare.repository.PetOrderLogRepository;
import com.example.petcare.repository.PetOrderRepository;
import com.example.petcare.repository.PetOrderScheduleRepository;
import com.example.petcare.repository.ServiceRecordImageRepository;
import com.example.petcare.repository.ServiceRecordRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ServiceRecordService {

    private final ServiceRecordRepository serviceRecordRepository;
    private final ServiceRecordImageRepository serviceRecordImageRepository;
    private final PetOrderRepository petOrderRepository;
    private final PetOrderScheduleRepository petOrderScheduleRepository;
    private final PetOrderLogRepository petOrderLogRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public ServiceRecordService(ServiceRecordRepository serviceRecordRepository,
        ServiceRecordImageRepository serviceRecordImageRepository,
        PetOrderRepository petOrderRepository,
        PetOrderScheduleRepository petOrderScheduleRepository,
        PetOrderLogRepository petOrderLogRepository) {
        this.serviceRecordRepository = serviceRecordRepository;
        this.serviceRecordImageRepository = serviceRecordImageRepository;
        this.petOrderRepository = petOrderRepository;
        this.petOrderScheduleRepository = petOrderScheduleRepository;
        this.petOrderLogRepository = petOrderLogRepository;
    }

    @Transactional
    public Long create(ServiceRecordCreateRequest request) {
        validateCreateRequest(request);

        PetOrder order = petOrderRepository.findByIdAndDeleted(request.getOrderId(), 0)
            .orElseThrow(() -> new RuntimeException("订单不存在"));

        if (!Objects.equals(order.getSitterId(), request.getSitterId())) {
            throw new RuntimeException("当前服务者无权提交该订单服务记录");
        }

        if (!"SERVING".equals(order.getOrderStatus()) && !"TAKEN".equals(order.getOrderStatus())) {
            throw new RuntimeException("当前订单状态不可提交服务记录");
        }

        if (request.getScheduleId() != null && serviceRecordRepository.existsByOrderIdAndScheduleId(request.getOrderId(), request.getScheduleId())) {
            throw new RuntimeException("该服务日程已提交过服务记录");
        }

        ServiceRecord record = new ServiceRecord();
        record.setOrderId(request.getOrderId());
        record.setScheduleId(request.getScheduleId());
        record.setSitterId(request.getSitterId());
        record.setUserId(request.getUserId());
        record.setRecordStatus("SUBMITTED");
        record.setPetStatus(emptyToDefault(request.getPetStatus(), "NORMAL"));
        record.setCompletedItemsJson(toJson(request.getCompletedItems()));
        record.setRemark(request.getRemark());
        record.setArrivedAt(parseDateTime(request.getArrivedAt()));
        record.setSubmittedAt(LocalDateTime.now());

        serviceRecordRepository.save(record);

        List<String> imageUrls = request.getImageUrls() == null ? new ArrayList<>() : request.getImageUrls();
        for (int i = 0; i < imageUrls.size(); i++) {
            String url = imageUrls.get(i);
            if (url == null || url.trim().isEmpty())
            {continue;}

            ServiceRecordImage image = new ServiceRecordImage();
            image.setRecordId(record.getId());
            image.setImageUrl(url.trim());
            image.setSortNo(i + 1);
            serviceRecordImageRepository.save(image);
        }

        if (request.getScheduleId() != null) {
            Optional<PetOrderSchedule> scheduleOpt = petOrderScheduleRepository.findById(request.getScheduleId());
            if (scheduleOpt.isPresent()) {
                PetOrderSchedule schedule = scheduleOpt.get();
                if (!"CANCELLED".equals(schedule.getScheduleStatus())) {
                    schedule.setScheduleStatus("RECORDED");
                    petOrderScheduleRepository.save(schedule);
                }
            }
        }

        recalculateOrderStatusAfterRecord(order.getId());

        writeLog(order.getId(), "SUBMIT_SERVICE_RECORD", "SITTER", request.getSitterId(), "服务者提交服务记录");

        return record.getId();
    }

    private void recalculateOrderStatusAfterRecord(Long orderId) {
        PetOrder order = petOrderRepository.findByIdAndDeleted(orderId, 0)
            .orElseThrow(() -> new RuntimeException("订单不存在"));

        List<PetOrderSchedule> schedules = petOrderScheduleRepository.findByOrderIdOrderByServiceDateAsc(orderId);
        if (schedules == null || schedules.isEmpty()) {
            return;
        }

        long total = schedules.size();
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
        petOrderRepository.save(order);
    }

    public List<ServiceRecordListItemResponse> listByOrder(Long orderId) {
        List<ServiceRecord> list = serviceRecordRepository.findByOrderIdOrderByIdDesc(orderId);
        if (list.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> recordIds = list.stream().map(ServiceRecord::getId).collect(Collectors.toList());
        Map<Long, Integer> imageCountMap = serviceRecordImageRepository.findAll().stream()
            .filter(item -> recordIds.contains(item.getRecordId()))
            .collect(Collectors.groupingBy(ServiceRecordImage::getRecordId, Collectors.collectingAndThen(Collectors.counting(), Long::intValue)));

        List<ServiceRecordListItemResponse> result = new ArrayList<>();
        for (ServiceRecord item : list) {
            ServiceRecordListItemResponse response = new ServiceRecordListItemResponse();
            response.setId(item.getId());
            response.setOrderId(item.getOrderId());
            response.setScheduleId(item.getScheduleId());
            response.setPetStatus(item.getPetStatus());
            response.setRecordStatus(item.getRecordStatus());
            response.setSubmittedAt(formatDateTime(item.getSubmittedAt()));
            response.setImageCount(imageCountMap.getOrDefault(item.getId(), 0));
            result.add(response);
        }
        return result;
    }

    public ServiceRecordDetailResponse detail(Long id) {
        ServiceRecord record = serviceRecordRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("服务记录不存在"));

        List<ServiceRecordImage> images = serviceRecordImageRepository.findByRecordIdOrderBySortNoAscIdAsc(record.getId());

        ServiceRecordDetailResponse response = new ServiceRecordDetailResponse();
        response.setId(record.getId());
        response.setOrderId(record.getOrderId());
        response.setScheduleId(record.getScheduleId());
        response.setSitterId(record.getSitterId());
        response.setUserId(record.getUserId());
        response.setRecordStatus(record.getRecordStatus());
        response.setPetStatus(record.getPetStatus());
        response.setCompletedItems(parseJsonList(record.getCompletedItemsJson()));
        response.setRemark(record.getRemark());
        response.setArrivedAt(formatDateTime(record.getArrivedAt()));
        response.setSubmittedAt(formatDateTime(record.getSubmittedAt()));
        response.setImageUrls(images.stream().map(ServiceRecordImage::getImageUrl).collect(Collectors.toList()));
        return response;
    }

    private void validateCreateRequest(ServiceRecordCreateRequest request) {
        if (request.getOrderId() == null) {
            throw new RuntimeException("订单ID不能为空");
        }
        if (request.getSitterId() == null) {
            throw new RuntimeException("服务者ID不能为空");
        }
        if (request.getUserId() == null) {
            throw new RuntimeException("用户ID不能为空");
        }
    }

    private String emptyToDefault(String value, String defaultValue) {
        return value == null || value.trim().isEmpty() ? defaultValue : value.trim();
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return LocalDateTime.parse(value.trim(), dateTimeFormatter);
    }

    private String formatDateTime(LocalDateTime value) {
        if (value == null) {
            return "";
        }
        return value.format(dateTimeFormatter);
    }

    private String toJson(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list == null ? new ArrayList<>() : list);
        } catch (Exception e) {
            throw new RuntimeException("完成事项JSON转换失败");
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

    private void writeLog(Long orderId, String action, String operatorType, Long operatorId, String remark) {
        PetOrderLog log = new PetOrderLog();
        log.setOrderId(orderId);
        log.setAction(action);
        log.setOperatorType(operatorType);
        log.setOperatorId(operatorId);
        log.setRemark(remark);
        petOrderLogRepository.save(log);
    }
}