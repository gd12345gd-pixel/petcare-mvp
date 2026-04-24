package com.example.petcare.service;

import com.example.petcare.entity.SitterCancelPenaltyRule;
import com.example.petcare.entity.SitterPenaltyRecord;
import com.example.petcare.entity.SitterProfile;
import com.example.petcare.repository.SitterCancelPenaltyRuleRepository;
import com.example.petcare.repository.SitterPenaltyRecordRepository;
import com.example.petcare.repository.SitterProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SitterCancelPenaltyService {

    private final SitterProfileRepository sitterProfileRepository;
    private final SitterCancelPenaltyRuleRepository cancelRuleRepository;
    private final SitterPenaltyRecordRepository penaltyRecordRepository;

    @Transactional
    public void applyCancelPenalty(Long sitterId, Long orderId, LocalDateTime serviceStartTime) {
        SitterProfile sitter = sitterProfileRepository.findById(sitterId)
                .orElseThrow(() -> new RuntimeException("接单师不存在"));

        BigDecimal hoursBeforeStart = BigDecimal.valueOf(
                Duration.between(LocalDateTime.now(), serviceStartTime).toMinutes() / 60.0
        );

        SitterCancelPenaltyRule rule = matchCancelRule(hoursBeforeStart);

        if (rule == null) {
            throw new RuntimeException("未匹配到取消处罚规则");
        }

        int beforeCredit = sitter.getCreditScore();
        BigDecimal beforeDeposit = sitter.getDepositAmount();

        int afterCredit = Math.max(0, beforeCredit + rule.getCreditChange());
        BigDecimal afterDeposit = beforeDeposit.subtract(rule.getDepositPenaltyAmount());

        if (afterDeposit.compareTo(BigDecimal.ZERO) < 0) {
            afterDeposit = BigDecimal.ZERO;
        }

        sitter.setCreditScore(afterCredit);
        sitter.setDepositAmount(afterDeposit);
        sitter.setCancelCount(sitter.getCancelCount() + 1);

        if (rule.getDowngradeToLevel() != null && !rule.getDowngradeToLevel().isBlank()) {
            sitter.setLevelCode(rule.getDowngradeToLevel());
        }

        sitterProfileRepository.save(sitter);

        SitterPenaltyRecord record = new SitterPenaltyRecord();
        record.setSitterId(sitterId);
        record.setOrderId(orderId);
        record.setPenaltyType("CANCEL");
        record.setReason(rule.getRuleName());
        record.setCreditChange(rule.getCreditChange());
        record.setDepositPenaltyAmount(rule.getDepositPenaltyAmount());
        record.setBeforeCreditScore(beforeCredit);
        record.setAfterCreditScore(afterCredit);
        record.setBeforeDepositAmount(beforeDeposit);
        record.setAfterDepositAmount(afterDeposit);

        penaltyRecordRepository.save(record);
    }

    private SitterCancelPenaltyRule matchCancelRule(BigDecimal hoursBeforeStart) {
        List<SitterCancelPenaltyRule> rules = cancelRuleRepository.findByEnabledTrueOrderBySortOrderAsc();

        for (SitterCancelPenaltyRule rule : rules) {
            BigDecimal min = rule.getMinHoursBeforeStart();
            BigDecimal max = rule.getMaxHoursBeforeStart();

            boolean matchMin = min == null || hoursBeforeStart.compareTo(min) >= 0;
            boolean matchMax = max == null || hoursBeforeStart.compareTo(max) < 0;

            if (matchMin && matchMax) {
                return rule;
            }
        }

        return null;
    }
}
