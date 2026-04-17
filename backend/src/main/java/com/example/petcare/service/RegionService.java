package com.example.petcare.service;

import com.example.petcare.dto.TencentRegionResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class  RegionService {

    @Value("${tencent.map.key}")
    private String key;

    private final RestTemplate restTemplate;

    public RegionService (RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }


    public List<Map<String, Object>> getChinaRegions(String keyword) {
        String q = (keyword == null || keyword.isBlank()) ? "中国" : keyword;

        String url = "https://apis.map.qq.com/ws/district/v1/search?keyword="
            + URLEncoder.encode(q, StandardCharsets.UTF_8)
            + "&key=" + URLEncoder.encode(key, StandardCharsets.UTF_8);

        TencentRegionResponse resp = restTemplate.getForObject(url, TencentRegionResponse.class);

        if (resp == null || resp.getStatus() == null || resp.getStatus() != 0
            || resp.getResult() == null || resp.getResult().getLocations() == null) {
            throw new RuntimeException("获取行政区划失败");
        }

        return resp.getResult().getLocations().stream().map(item -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", item.getId());
            m.put("fullname", item.getFullname());
            m.put("pname", item.getPname());
            m.put("cname", item.getCname());
            m.put("name", item.getName());
            return m;
        }).collect(Collectors.toList());
    }
}