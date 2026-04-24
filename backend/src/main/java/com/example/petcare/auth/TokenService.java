package com.example.petcare.auth;

import com.example.petcare.entity.User;
import com.example.petcare.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;

@Service
public class TokenService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    @Value("${auth.token-secret}")
    private String tokenSecret;

    private final UserRepository userRepository;

    public TokenService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String generateToken(User user) {
        String payload = user.getId() + ":" + user.getOpenid() + ":" + System.currentTimeMillis();
        String encodedPayload = base64UrlEncode(payload.getBytes(StandardCharsets.UTF_8));
        String signature = sign(encodedPayload);
        return encodedPayload + "." + signature;
    }

    public Optional<Long> verifyToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }

        String[] parts = token.split("\\.");
        if (parts.length != 2 || !sign(parts[0]).equals(parts[1])) {
            return Optional.empty();
        }

        String payload;
        try {
            payload = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }

        String[] fields = payload.split(":", 3);
        if (fields.length != 3) {
            return Optional.empty();
        }

        Long userId;
        try {
            userId = Long.valueOf(fields[0]);
        } catch (NumberFormatException e) {
            return Optional.empty();
        }

        String openid = fields[1];
        return userRepository.findById(userId)
            .filter(user -> openid.equals(user.getOpenid()))
            .map(User::getId);
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(tokenSecret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM);
            mac.init(keySpec);
            return base64UrlEncode(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("生成登录令牌失败", e);
        }
    }

    private String base64UrlEncode(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
