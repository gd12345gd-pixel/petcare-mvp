package com.example.petcare.service;

import com.example.petcare.entity.SitterDepositRule;
import com.example.petcare.entity.SitterProfile;
import com.example.petcare.repository.PetOrderRepository;
import com.example.petcare.repository.SitterDepositRuleRepository;
import com.example.petcare.repository.SitterProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SitterDepositService {

    private final SitterProfileRepository sitterProfileRepository;
    private final SitterDepositRuleRepository depositRuleRepository;
    private final PetOrderRepository orderRepository;

    @Transactional
    public void payDeposit(Long userId) {
        SitterProfile sitter = sitterProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("请先注册成为接单师"));

        SitterDepositRule rule = depositRuleRepository.findFirstByEnabledTrueOrderByIdDesc()
                .orElseThrow(() -> new RuntimeException("押金规则未配置"));

        sitter.setDepositAmount(rule.getDepositAmount());
        sitter.setDepositStatus("PAID");

        sitterProfileRepository.save(sitter);
    }

    @Transactional
    public void requestRefundDeposit(Long userId) {
        SitterProfile sitter = sitterProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("接单师不存在"));

        boolean hasActiveOrder = orderRepository.existsBySitterIdAndOrderStatusIn(
                sitter.getId(),
                List.of("ACCEPTED", "SERVING", "WAIT_SERVICE")
        );

        if (hasActiveOrder) {
            throw new RuntimeException("当前有未完成订单，完成后才可退押金");
        }

        if (!"PAID".equals(sitter.getDepositStatus())) {
            throw new RuntimeException("当前押金状态不可退款");
        }

        sitter.setDepositStatus("REFUNDING");

        sitterProfileRepository.save(sitter);
    }



}
