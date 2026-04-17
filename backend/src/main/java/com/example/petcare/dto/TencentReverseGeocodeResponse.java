package com.example.petcare.dto;

import lombok.Data;

@Data
public class TencentReverseGeocodeResponse {

    private Integer status;
    private String message;
    private ResultData result;

    @Data
    public static class ResultData {
        private AddressComponent address_component;
        private AdInfo ad_info;
        private String address;
    }

    @Data
    public static class AddressComponent {
        private String province;
        private String city;
        private String district;
    }

    @Data
    public static class AdInfo {
        private String adcode;
        private String province;
        private String city;
        private String district;
    }
}