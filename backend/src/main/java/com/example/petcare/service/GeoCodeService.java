package com.example.petcare.service;

import com.example.petcare.dto.LocationRegionResult;
import com.example.petcare.dto.TencentReverseGeocodeResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class   GeoCodeService {

    @Value("${tencent.map.key}")
    private String key;

    private final RestTemplate restTemplate;

    public GeoCodeService (RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }


    public LocationRegionResult reverseRegion(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            throw new RuntimeException("经纬度不能为空");
        }

        String location = latitude + "," + longitude;
        String url = "https://apis.map.qq.com/ws/geocoder/v1/?location="
            + URLEncoder.encode(location, StandardCharsets.UTF_8)
            + "&key=" + URLEncoder.encode(key, StandardCharsets.UTF_8);

        TencentReverseGeocodeResponse resp =
            restTemplate.getForObject(url, TencentReverseGeocodeResponse.class);

        if (resp == null || resp.getStatus() == null || resp.getStatus() != 0 || resp.getResult() == null) {
            throw new RuntimeException("逆地址解析失败");
        }

        TencentReverseGeocodeResponse.ResultData result = resp.getResult();

        String province = result.getAd_info() != null ? result.getAd_info().getProvince() : null;
        String city = result.getAd_info() != null ? result.getAd_info().getCity() : null;
        String district = result.getAd_info() != null ? result.getAd_info().getDistrict() : null;
        String adcode = result.getAd_info() != null ? result.getAd_info().getAdcode() : null;
        String fullAddress = result.getAddress();

        return new LocationRegionResult(province, city, district, adcode, fullAddress);
    }
}