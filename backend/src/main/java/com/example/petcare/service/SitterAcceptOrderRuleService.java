package com.example.petcare.service;

import com.example.petcare.entity.SitterLevelRule;
import com.example.petcare.entity.SitterProfile;
import com.example.petcare.repository.PetOrderRepository;
import com.example.petcare.repository.SitterLevelRuleRepository;
import com.example.petcare.repository.SitterProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class SitterAcceptOrderRuleService {

    private final SitterProfileRepository sitterProfileRepository;
    private final SitterLevelRuleRepository levelRuleRepository;
    private final PetOrderRepository orderRepository;

    public void checkCanAcceptOrder(Long userId) {
        SitterProfile sitter = sitterProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("请先注册成为接单师"));

        if (!"APPROVED".equals(sitter.getAuditStatus())) {
            throw new RuntimeException("接单师资料未审核通过");
        }

        if (!"PAID".equals(sitter.getDepositStatus()) && !"LOCKED".equals(sitter.getDepositStatus())) {
            throw new RuntimeException("接单前需先缴纳99元押金");
        }

        if (sitter.getCreditScore() == null || sitter.getCreditScore() < 70) {
            throw new RuntimeException("信誉分过低，暂不可接单");
        }

        SitterLevelRule levelRule = levelRuleRepository
                .findByLevelCodeAndEnabledTrue(sitter.getLevelCode())
                .orElseThrow(() -> new RuntimeException("接单师等级规则不存在"));

        LocalDate today = LocalDate.now();

        int todayAcceptedCount = orderRepository.countTodayAcceptedOrders(
                sitter.getId(),
                today.atStartOfDay(),
                today.plusDays(1).atStartOfDay()
        );

        if (todayAcceptedCount >= levelRule.getDailyOrderLimit()) {
            throw new RuntimeException("今日接单数量已达上限");
        }
    }
}
