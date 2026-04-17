package com.example.petcare.repository;

import com.example.petcare.entity.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {

    List<UserAddress> findByUserIdAndDeletedOrderByIsDefaultDescIdDesc(Long userId, Integer deleted);

    Optional<UserAddress> findByIdAndDeleted(Long id, Integer deleted);

    Optional<UserAddress> findByIdAndUserIdAndDeleted(Long id, Long userId, Integer deleted);

    List<UserAddress> findByUserIdAndIsDefaultAndDeleted(Long userId, Integer isDefault, Integer deleted);
}