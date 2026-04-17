package com.example.petcare.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PetCommentVO {
    private Long id;
    private Long userId;
    private String nickname;
    private String avatarUrl;
    private String content;
    private String createdAt;
}