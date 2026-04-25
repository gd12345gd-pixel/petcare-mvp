package com.example.petcare.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final TokenService tokenService;

    public AuthInterceptor(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod()) || !requiresAuth(request)) {
            return true;
        }

        String token = resolveToken(request);
        Long userId = tokenService.verifyToken(token).orElse(null);
        if (userId == null) {
            writeUnauthorized(response);
            return false;
        }

        AuthContext.setCurrentUserId(userId);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        AuthContext.clear();
    }

    private boolean requiresAuth(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();

        if (path.startsWith("/api/address/")
            || path.equals("/api/auth/profile")
            || path.startsWith("/api/pet/")
            || path.startsWith("/api/orders/")
            || path.startsWith("/api/order/remark/")
            || path.startsWith("/api/sitter/")
            || path.startsWith("/api/admin/")
            || path.startsWith("/api/feedback/")
            || path.equals("/api/feedback")
            || path.startsWith("/api/reviews/")
            || path.startsWith("/api/notifications/")
            || path.equals("/api/notifications")
            || path.startsWith("/api/service-record/")
            || path.startsWith("/api/files/")) {
            return true;
        }

        if (path.equals("/api/pet-community/comments") && "POST".equalsIgnoreCase(method)) {
            return true;
        }

        return path.equals("/api/pet-community/lost")
            || path.equals("/api/pet-community/found");
    }

    private String resolveToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || header.isBlank()) {
            return null;
        }
        if (header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return header;
    }

    private void writeUnauthorized(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"code\":401,\"message\":\"请先登录\",\"data\":null}");
    }
}
