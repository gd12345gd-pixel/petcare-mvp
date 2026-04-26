package com.example.petcare.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class SitterGrowthResponse {

    private String levelCode;
    private String levelName;
    private Integer dailyOrderLimit;
    private Integer todayAcceptedCount;
    private Integer creditScore;
    private Integer completedOrders;
    private Integer growthValue;
    private Integer nextGrowthValue;
    private Integer growthPercent;
    private Integer remainToUpgrade;
    private String nextLevelCode;
    private Integer nextDailyOrderLimit;
    private Boolean maxLevel;
    private List<GrowthRecordItem> records = new ArrayList<>();

    @Data
    public static class GrowthRecordItem {
        private Integer value;
        private String desc;
    }
}
