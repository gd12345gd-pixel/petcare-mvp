package com.example.petcare.service;

import com.example.petcare.entity.Review;
import com.example.petcare.entity.ServiceItem;
import com.example.petcare.entity.ServiceRecord;
import com.example.petcare.repository.ReviewRepository;
import com.example.petcare.repository.ServiceItemRepository;
import com.example.petcare.repository.ServiceRecordRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ServiceCatalogService {

    private final ServiceItemRepository serviceItemRepository;
    private final ServiceRecordRepository serviceRecordRepository;
    private final ReviewRepository reviewRepository;

    public ServiceCatalogService(
        ServiceItemRepository serviceItemRepository,
        ServiceRecordRepository serviceRecordRepository,
        ReviewRepository reviewRepository
    ) {
        this.serviceItemRepository = serviceItemRepository;
        this.serviceRecordRepository = serviceRecordRepository;
        this.reviewRepository = reviewRepository;
    }

    public List<ServiceItem> list() {
        return serviceItemRepository.findByActiveTrueOrderBySortNoAsc();
    }

    public Map<String, Object> detail(Long id) {
        ServiceItem item = serviceItemRepository
            .findById(id)
            .orElseThrow(() -> new EntityNotFoundException("服务不存在"));

        List<ServiceRecord> records = serviceRecordRepository.findAll().stream().limit(6).toList();
        List<Review> reviews = reviewRepository.findAll().stream().limit(10).toList();

        Map<String, Object> r = new HashMap<>();
        r.put("service", item);
        r.put("records", records);
        r.put("reviews", reviews);
        return r;
    }
}
