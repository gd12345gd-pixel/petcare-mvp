package com.example.petcare.service;

import com.example.petcare.entity.SitterLevelRule;
import com.example.petcare.entity.SitterProfile;
import com.example.petcare.repository.PetOrderRepository;
import com.example.petcare.repository.SitterLevelRuleRepository;
import com.example.petcare.repository.SitterProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

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
            throw new RuntimeException(buildDailyLimitExceededMessage(sitter, levelRule));
        }
    }

    private String buildDailyLimitExceededMessage(SitterProfile sitter, SitterLevelRule currentRule) {
        String currentLevelCode = currentRule.getLevelCode() == null ? "Lv1" : currentRule.getLevelCode();
        int currentDailyLimit = currentRule.getDailyOrderLimit() == null ? 0 : currentRule.getDailyOrderLimit();

        List<SitterLevelRule> rules = levelRuleRepository.findByEnabledTrueOrderBySortOrderAsc();
        SitterLevelRule nextRule = null;
        for (SitterLevelRule rule : rules) {
            if (rule.getSortOrder() != null && currentRule.getSortOrder() != null
                && rule.getSortOrder() > currentRule.getSortOrder()) {
                nextRule = rule;
                break;
            }
        }

        if (nextRule == null) {
            return String.format(
                "今日接单已满\n\n当前等级：%s（每日%d单）\n你已是当前最高等级，可前往规则页查看全部权益",
                currentLevelCode,
                currentDailyLimit
            );
        }

        int completedOrders = sitter.getCompletedOrders() == null ? 0 : sitter.getCompletedOrders();
        int requiredCompletedOrders = nextRule.getRequiredCompletedOrders() == null ? completedOrders : nextRule.getRequiredCompletedOrders();
        int remainOrders = Math.max(0, requiredCompletedOrders - completedOrders);
        String nextLevelCode = nextRule.getLevelCode() == null ? "下一等级" : nextRule.getLevelCode();
        int nextDailyLimit = nextRule.getDailyOrderLimit() == null ? 0 : nextRule.getDailyOrderLimit();

        return String.format(
            "今日接单已满\n\n当前等级：%s（每日%d单）\n再完成 %d 单可升级 %s（每日%d单）",
            currentLevelCode,
            currentDailyLimit,
            remainOrders,
            nextLevelCode,
            nextDailyLimit
        );
    }
}
