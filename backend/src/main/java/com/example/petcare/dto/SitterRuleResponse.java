package com.example.petcare.dto;

import com.example.petcare.entity.SitterCancelPenaltyRule;
import com.example.petcare.entity.SitterDepositRule;
import com.example.petcare.entity.SitterLevelRule;
import lombok.Data;

import java.util.List;

@Data
public class SitterRuleResponse {

    private List<SitterLevelRule> levelRules;
    private SitterDepositRule depositRule;
    private List<SitterCancelPenaltyRule> cancelPenaltyRules;
}
