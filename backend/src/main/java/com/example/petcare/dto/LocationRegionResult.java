package com.example.petcare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 经纬度逆解析后的区域信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationRegionResult {

    /**
     * 省份（如：上海市）
     */
    private String province;

    /**
     * 城市（如：上海市）
     */
    private String city;

    /**
     * 区县（如：徐汇区）
     */
    private String district;

    /**
     * 行政区划编码（如：310104）
     */
    private String adcode;

    /**
     * 完整地址（如：上海市徐汇区漕河泾街道田林路）
     */
    private String fullAddress;
}