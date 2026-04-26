package com.example.petcare.service;

import com.example.petcare.entity.SitterGrowthLog;
import com.example.petcare.repository.SitterGrowthLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SitterGrowthLogService {

    private final SitterGrowthLogRepository sitterGrowthLogRepository;

    public void log(Long sitterId, Long orderId, Integer changeValue, String changeType, String description) {
        if (sitterId == null || changeValue == null || changeType == null || description == null) {
            return;
        }
        SitterGrowthLog log = new SitterGrowthLog();
        log.setSitterId(sitterId);
        log.setOrderId(orderId);
        log.setChangeValue(changeValue);
        log.setChangeType(changeType);
        log.setDescription(description);
        log.setCreatedAt(LocalDateTime.now());
        sitterGrowthLogRepository.save(log);
    }
}
