package com.example.petcare.dto;

import java.util.List;

public class PetUpdateRequest extends PetCreateRequest {
    private Long id;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
}