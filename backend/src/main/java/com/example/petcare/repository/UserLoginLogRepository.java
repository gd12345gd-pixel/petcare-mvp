package com.example.petcare.repository;

import com.example.petcare.entity.UserLoginLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserLoginLogRepository extends JpaRepository<UserLoginLog, Long> {
}
