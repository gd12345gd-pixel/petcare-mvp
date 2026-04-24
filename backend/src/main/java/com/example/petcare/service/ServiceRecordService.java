package com.example.petcare.service;

import com.example.petcare.dto.ServiceRecordCreateRequest;
import com.example.petcare.dto.ServiceRecordDetailResponse;
import com.example.petcare.entity.*;
import com.example.petcare.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ServiceRecordService {

    private final ServiceRecordRepository serviceRecordRepository;
    private final ServiceRecordItemRepository serviceRecordItemRepository;
    private final ServiceRecordMediaRepository serviceRecordMediaRepository;
    private final PetOrderRepository petOrderRepository;
    private final PetOrderScheduleRepository petOrderScheduleRepository;

    public ServiceRecordService(ServiceRecordRepository serviceRecordRepository,
        ServiceRecordItemRepository serviceRecordItemRepository,
        ServiceRecordMediaRepository serviceRecordMediaRepository,
        PetOrderRepository petOrderRepository,
        PetOrderScheduleRepository petOrderScheduleRepository) {
        this.serviceRecordRepository = serviceRecordRepository;
        this.serviceRecordItemRepository = serviceRecordItemRepository;
        this.serviceRecordMediaRepository = serviceRecordMediaRepository;
        this.petOrderRepository = petOrderRepository;
        this.petOrderScheduleRepository = petOrderScheduleRepository;
    }

    @Transactional
    public ServiceRecord create(ServiceRecordCreateRequest request) {
        validateCreateRequest(request);

        PetOrder order = petOrderRepository.findByIdAndSitterIdAndDeleted(
            request.getOrderId(), request.getSitterId(), 0
        ).orElseThrow(() -> new RuntimeException("订单不存在"));

        PetOrderSchedule schedule = petOrderScheduleRepository.findByIdAndOrderId(
            request.getScheduleId(), request.getOrderId()
        ).orElseThrow(() -> new RuntimeException("服务日程不存在"));

        if (!"SERVING".equals(schedule.getScheduleStatus())) {
            throw new RuntimeException("当前服务日程未处于服务中，无法提交记录");
        }

        if (serviceRecordRepository.existsByOrderIdAndScheduleId(request.getOrderId(), request.getScheduleId())) {
            throw new RuntimeException("该服务日程已提交过服务记录");
        }

        ServiceRecord record = new ServiceRecord();
        record.setOrderId(request.getOrderId());
        record.setScheduleId(request.getScheduleId());
        record.setSitterId(request.getSitterId());
        record.setRemark(trimToNull(request.getRemark()));
        record.setAbnormalDesc(trimToNull(request.getAbnormalDesc()));
        record.setSubmittedAt(LocalDateTime.now());

        ServiceRecord saved = serviceRecordRepository.save(record);

        saveServiceItems(saved.getId(), request.getServiceItems());
        savePetObservations(saved.getId(), request.getPetObservations());
        saveImages(saved.getId(), request.getImages());
        saveVideos(saved.getId(), request.getVideos());

        schedule.setScheduleStatus("RECORDED");
        petOrderScheduleRepository.save(schedule);

        recalculateOrderStatus(order.getId());

        return saved;
    }

    public List<ServiceRecord> listByOrder(Long orderId) {
        return serviceRecordRepository.findByOrderIdOrderBySubmittedAtDesc(orderId);
    }

    public ServiceRecordDetailResponse detail(Long id) {
        ServiceRecord record = serviceRecordRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("服务记录不存在"));

        List<ServiceRecordItem> items = serviceRecordItemRepository.findByRecordId(record.getId());
        List<ServiceRecordMedia> mediaList = serviceRecordMediaRepository.findByRecordIdOrderBySortNoAscIdAsc(record.getId());

        List<String> serviceItems = items.stream()
            .filter(item -> "SERVICE_ITEM".equals(item.getItemType()))
            .map(ServiceRecordItem::getItemCode)
            .collect(Collectors.toList());

        List<String> petObservations = items.stream()
            .filter(item -> "PET_OBSERVATION".equals(item.getItemType()))
            .map(ServiceRecordItem::getItemCode)
            .collect(Collectors.toList());

        List<String> images = mediaList.stream()
            .filter(item -> "IMAGE".equals(item.getMediaType()))
            .map(ServiceRecordMedia::getMediaUrl)
            .collect(Collectors.toList());

        List<String> videos = mediaList.stream()
            .filter(item -> "VIDEO".equals(item.getMediaType()))
            .map(ServiceRecordMedia::getMediaUrl)
            .collect(Collectors.toList());

        ServiceRecordDetailResponse response = new ServiceRecordDetailResponse();
        response.setId(record.getId());
        response.setOrderId(record.getOrderId());
        response.setScheduleId(record.getScheduleId());
        response.setSitterId(record.getSitterId());
        response.setRemark(record.getRemark());
        response.setAbnormalDesc(record.getAbnormalDesc());
        response.setSubmittedAt(record.getSubmittedAt());
        response.setServiceItems(serviceItems);
        response.setPetObservations(petObservations);
        response.setImages(images);
        response.setVideos(videos);

        return response;
    }

    private void validateCreateRequest(ServiceRecordCreateRequest request) {
        if (request.getOrderId() == null) {
            throw new RuntimeException("订单ID不能为空");
        }
        if (request.getScheduleId() == null) {
            throw new RuntimeException("服务日程ID不能为空");
        }
        if (request.getSitterId() == null) {
            throw new RuntimeException("服务者ID不能为空");
        }
        if (request.getServiceItems() == null || request.getServiceItems().isEmpty()) {
            throw new RuntimeException("请至少选择1项服务项目");
        }
        if (request.getPetObservations() == null || request.getPetObservations().isEmpty()) {
            throw new RuntimeException("请至少选择1项宠物观察情况");
        }
        if (request.getVideos() == null || request.getVideos().isEmpty()) {
            throw new RuntimeException("请至少上传1个服务视频");
        }
        if (request.getVideos().size() > 3) {
            throw new RuntimeException("服务视频最多上传3个");
        }
        if (request.getImages() != null && request.getImages().size() > 9) {
            throw new RuntimeException("服务照片最多上传9张");
        }
        if (request.getPetObservations().contains("ABNORMAL") && isBlank(request.getAbnormalDesc())) {
            throw new RuntimeException("请填写异常情况");
        }
    }

    private void saveServiceItems(Long recordId, List<String> items) {
        if (items == null || items.isEmpty()) {
            return;
        }
        for (String item : items) {
            ServiceRecordItem entity = new ServiceRecordItem();
            entity.setRecordId(recordId);
            entity.setItemType("SERVICE_ITEM");
            entity.setItemCode(item);
            serviceRecordItemRepository.save(entity);
        }
    }

    private void savePetObservations(Long recordId, List<String> observations) {
        if (observations == null || observations.isEmpty()) {
            return;
        }
        for (String item : observations) {
            ServiceRecordItem entity = new ServiceRecordItem();
            entity.setRecordId(recordId);
            entity.setItemType("PET_OBSERVATION");
            entity.setItemCode(item);
            serviceRecordItemRepository.save(entity);
        }
    }

    private void saveImages(Long recordId, List<String> images) {
        if (images == null || images.isEmpty()) {
            return;
        }
        for (int i = 0; i < images.size(); i++) {
            ServiceRecordMedia media = new ServiceRecordMedia();
            media.setRecordId(recordId);
            media.setMediaType("IMAGE");
            media.setMediaUrl(images.get(i));
            media.setSortNo(i + 1);
            serviceRecordMediaRepository.save(media);
        }
    }

    private void saveVideos(Long recordId, List<String> videos) {
        if (videos == null || videos.isEmpty()) {
            return;
        }
        for (int i = 0; i < videos.size(); i++) {
            ServiceRecordMedia media = new ServiceRecordMedia();
            media.setRecordId(recordId);
            media.setMediaType("VIDEO");
            media.setMediaUrl(videos.get(i));
            media.setSortNo(i + 1);
            serviceRecordMediaRepository.save(media);
        }
    }

    private void recalculateOrderStatus(Long orderId) {
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

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}