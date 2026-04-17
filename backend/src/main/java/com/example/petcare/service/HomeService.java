package com.example.petcare.service;

import com.example.petcare.entity.ServiceRecord;
import com.example.petcare.enums.SitterStatus;
import com.example.petcare.repository.ServiceItemRepository;
import com.example.petcare.repository.ServiceRecordRepository;
import com.example.petcare.repository.SitterRepository;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class HomeService {

    private final ServiceItemRepository serviceItemRepository;
    private final SitterRepository sitterRepository;
    private final ServiceRecordRepository serviceRecordRepository;

    public HomeService(
        ServiceItemRepository serviceItemRepository,
        SitterRepository sitterRepository,
        ServiceRecordRepository serviceRecordRepository
    ) {
        this.serviceItemRepository = serviceItemRepository;
        this.sitterRepository = sitterRepository;
        this.serviceRecordRepository = serviceRecordRepository;
    }

    public Map<String, Object> getHomeData() {
        Map<String, Object> r = new HashMap<>();
        r.put("banners", List.of("全程视频记录", "实名认证服务者", "异常情况及时联系"));
        r.put("services", serviceItemRepository.findByActiveTrueOrderBySortNoAsc());
        r.put("sitters", sitterRepository.findByStatusOrderByRatingDesc(SitterStatus.ACTIVE));

        List<ServiceRecord> records = serviceRecordRepository.findAll();
        records.sort(
            Comparator.comparing(ServiceRecord::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                .reversed()
        );
        r.put("records", records.stream().limit(6).toList());
        return r;
    }
}
