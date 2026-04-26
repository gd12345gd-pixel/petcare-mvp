package com.example.petcare.service;

import com.example.petcare.entity.SitterLevelRule;
import com.example.petcare.entity.SitterProfile;
import com.example.petcare.repository.PetOrderRepository;
import com.example.petcare.repository.SitterLevelRuleRepository;
import com.example.petcare.repository.SitterProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SitterLevelUpgradeService {

    private final SitterProfileRepository sitterProfileRepository;
    private final SitterLevelRuleRepository levelRuleRepository;
    private final PetOrderRepository orderRepository;
    private final SitterGrowthLogService sitterGrowthLogService;

    @Transactional
    public void handleOrderCompleted(Long sitterId, Long orderId) {
        SitterProfile sitter = sitterProfileRepository.findById(sitterId)
                .orElseThrow(() -> new RuntimeException("接单师不存在"));

        sitter.setCompletedOrders(sitter.getCompletedOrders() + 1);
        sitter.setCreditScore(Math.min(120, sitter.getCreditScore() + 2));
        sitterGrowthLogService.log(sitterId, orderId, 10, "ORDER_COMPLETED", "完成订单");

        List<SitterLevelRule> rules = levelRuleRepository.findByEnabledTrueOrderBySortOrderAsc();

        String newLevel = sitter.getLevelCode();

        for (SitterLevelRule rule : rules) {
            boolean canUpgrade =
                    sitter.getCompletedOrders() >= rule.getRequiredCompletedOrders()
                            && sitter.getCreditScore() >= rule.getRequiredCreditScore()
                            && (Boolean.TRUE.equals(rule.getAllowNoShow()) || sitter.getNoShowCount() == 0);

            if (canUpgrade) {
                newLevel = rule.getLevelCode();
            }
        }

        sitter.setLevelCode(newLevel);

        boolean hasActiveOrder = orderRepository.existsBySitterIdAndOrderStatusIn(
                sitter.getId(),
                List.of("TAKEN", "SERVING", "PART_SERVING", "PART_COMPLETED")
        );

        if (!hasActiveOrder && "LOCKED".equals(sitter.getDepositStatus())) {
            sitter.setDepositStatus("PAID");
        }

        sitterProfileRepository.save(sitter);
    }
}
