package com.example.petcare.auth;

public final class AuthContext {

    private static final ThreadLocal<Long> CURRENT_USER_ID = new ThreadLocal<>();

    private AuthContext() {
    }

    public static void setCurrentUserId(Long userId) {
        CURRENT_USER_ID.set(userId);
    }

    public static Long getCurrentUserId() {
        return CURRENT_USER_ID.get();
    }

    public static Long requireCurrentUserId() {
        Long userId = getCurrentUserId();
        if (userId == null) {
            throw new RuntimeException("请先登录");
        }
        return userId;
    }

    public static void clear() {
        CURRENT_USER_ID.remove();
    }
}
