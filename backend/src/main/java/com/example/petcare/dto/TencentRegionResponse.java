package com.example.petcare.dto;

import lombok.Data;

import java.util.List;

@Data
public class TencentRegionResponse {
    private Integer status;
    private String message;
    private ResultData result;

    @Data
    public static class ResultData {
        private List<RegionItem> locations;
    }

    @Data
    public static class RegionItem {
        private String id;
        private String fullname;
        private String pname;
        private String cname;
        private String name;
        private String[] cidx;
    }
}