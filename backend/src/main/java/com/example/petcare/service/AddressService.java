package com.example.petcare.service;

import com.example.petcare.dto.*;
import com.example.petcare.entity.UserAddress;
import com.example.petcare.repository.UserAddressRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AddressService {

    private final UserAddressRepository userAddressRepository;

    public AddressService(UserAddressRepository userAddressRepository) {
        this.userAddressRepository = userAddressRepository;
    }

    public List<AddressResponse> list(Long userId) {
        return userAddressRepository.findByUserIdAndDeletedOrderByIsDefaultDescIdDesc(userId, 0)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public AddressResponse detail(Long id) {
        UserAddress address = userAddressRepository.findByIdAndDeleted(id, 0)
            .orElseThrow(() -> new RuntimeException("地址不存在"));
        return toResponse(address);
    }

    @Transactional
    public AddressResponse create(AddressCreateRequest request) {
        validateCreateOrUpdate(
            request.getUserId(),
            request.getContactName(),
            request.getContactPhone(),
            request.getProvince(),
            request.getCity(),
            request.getDistrict(),
            request.getDetailAddress()
        );

        if (request.getIsDefault() != null && request.getIsDefault() == 1) {
            clearDefaultAddress(request.getUserId());
        }

        UserAddress address = new UserAddress();
        address.setUserId(request.getUserId());
        address.setContactName(request.getContactName());
        address.setContactPhone(request.getContactPhone());
        address.setProvince(request.getProvince());
        address.setCity(request.getCity());
        address.setDistrict(request.getDistrict());
        address.setDetailAddress(request.getDetailAddress());
        address.setLatitude(request.getLatitude());
        address.setLongitude(request.getLongitude());
        address.setTagName(request.getTagName());
        address.setIsDefault(request.getIsDefault() != null ? request.getIsDefault() : 0);
        address.setDeleted(0);

        UserAddress saved = userAddressRepository.save(address);
        return toResponse(saved);
    }

    @Transactional
    public AddressResponse update(AddressUpdateRequest request) {
        if (request.getId() == null) {
            throw new RuntimeException("地址ID不能为空");
        }

        validateCreateOrUpdate(
            request.getUserId(),
            request.getContactName(),
            request.getContactPhone(),
            request.getProvince(),
            request.getCity(),
            request.getDistrict(),
            request.getDetailAddress()
        );

        UserAddress address = userAddressRepository.findByIdAndUserIdAndDeleted(request.getId(), request.getUserId(), 0)
            .orElseThrow(() -> new RuntimeException("地址不存在"));

        if (request.getIsDefault() != null && request.getIsDefault() == 1) {
            clearDefaultAddress(request.getUserId());
        }

        address.setContactName(request.getContactName());
        address.setContactPhone(request.getContactPhone());
        address.setProvince(request.getProvince());
        address.setCity(request.getCity());
        address.setDistrict(request.getDistrict());
        address.setDetailAddress(request.getDetailAddress());
        address.setLatitude(request.getLatitude());
        address.setLongitude(request.getLongitude());
        address.setTagName(request.getTagName());
        address.setIsDefault(request.getIsDefault() != null ? request.getIsDefault() : 0);

        UserAddress saved = userAddressRepository.save(address);
        return toResponse(saved);
    }

    @Transactional
    public void delete(AddressDeleteRequest request) {
        UserAddress address = userAddressRepository.findByIdAndUserIdAndDeleted(request.getId(), request.getUserId(), 0)
            .orElseThrow(() -> new RuntimeException("地址不存在"));

        address.setDeleted(1);
        address.setIsDefault(0);
        userAddressRepository.save(address);
    }

    @Transactional
    public void setDefault(AddressSetDefaultRequest request) {
        UserAddress address = userAddressRepository.findByIdAndUserIdAndDeleted(request.getId(), request.getUserId(), 0)
            .orElseThrow(() -> new RuntimeException("地址不存在"));

        clearDefaultAddress(request.getUserId());
        address.setIsDefault(1);
        userAddressRepository.save(address);
    }

    private void clearDefaultAddress(Long userId) {
        List<UserAddress> defaults = userAddressRepository.findByUserIdAndIsDefaultAndDeleted(userId, 1, 0);
        for (UserAddress item : defaults) {
            item.setIsDefault(0);
        }
        userAddressRepository.saveAll(defaults);
    }

    private void validateCreateOrUpdate(Long userId,
        String contactName,
        String contactPhone,
        String province,
        String city,
        String district,
        String detailAddress) {
        if (userId == null) {
            throw new RuntimeException("用户ID不能为空");
        }
        if (isBlank(contactName)) {
            throw new RuntimeException("联系人不能为空");
        }
        if (isBlank(contactPhone)) {
            throw new RuntimeException("联系电话不能为空");
        }
        if (isBlank(province) || isBlank(city) || isBlank(district)) {
            throw new RuntimeException("省市区不能为空");
        }
        if (isBlank(detailAddress)) {
            throw new RuntimeException("详细地址不能为空");
        }
    }

    private boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }

    private AddressResponse toResponse(UserAddress address) {
        AddressResponse response = new AddressResponse();
        response.setId(address.getId());
        response.setUserId(address.getUserId());
        response.setContactName(address.getContactName());
        response.setContactPhone(address.getContactPhone());
        response.setProvince(address.getProvince());
        response.setCity(address.getCity());
        response.setDistrict(address.getDistrict());
        response.setDetailAddress(address.getDetailAddress());
        response.setLatitude(address.getLatitude());
        response.setLongitude(address.getLongitude());
        response.setTagName(address.getTagName());
        response.setIsDefault(address.getIsDefault());
        response.setFullAddress(
            safe(address.getProvince()) +
                safe(address.getCity()) +
                safe(address.getDistrict()) +
                safe(address.getDetailAddress())
        );
        return response;
    }

    private String safe(String str) {
        return str == null ? "" : str;
    }
}