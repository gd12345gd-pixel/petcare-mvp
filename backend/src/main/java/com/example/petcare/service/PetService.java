package com.example.petcare.service;

import com.example.petcare.dto.PetCreateRequest;
import com.example.petcare.dto.PetResponse;
import com.example.petcare.dto.PetUpdateRequest;
import com.example.petcare.entity.Pet;
import com.example.petcare.repository.PetRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PetService {

    private final PetRepository petRepository;
    private final ObjectMapper objectMapper;

    public PetService(PetRepository petRepository, ObjectMapper objectMapper) {
        this.petRepository = petRepository;
        this.objectMapper = objectMapper;
    }

    public List<PetResponse> list(Long userId) {
        return petRepository.findByUserIdAndDeletedOrderByIdDesc(userId, 0)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public PetResponse detail(Long id) {
        Pet pet = petRepository.findByIdAndDeleted(id, 0)
                .orElseThrow(() -> new RuntimeException("宠物不存在"));
        return toResponse(pet);
    }

    @Transactional
    public PetResponse create(PetCreateRequest request) {
        validate(request);

        Pet pet = new Pet();
        fillPet(pet, request);
        pet.setDeleted(0);

        Pet saved = petRepository.save(pet);
        return toResponse(saved);
    }

    @Transactional
    public PetResponse update(PetUpdateRequest request) {
        if (request.getId() == null) {
            throw new RuntimeException("宠物ID不能为空");
        }
        validate(request);

        Pet pet = petRepository.findByIdAndUserIdAndDeleted(request.getId(), request.getUserId(), 0)
                .orElseThrow(() -> new RuntimeException("宠物不存在"));

        fillPet(pet, request);
        Pet saved = petRepository.save(pet);
        return toResponse(saved);
    }

    private void validate(PetCreateRequest request) {
        if (request.getUserId() == null) throw new RuntimeException("用户ID不能为空");
        if (isBlank(request.getAvatarUrl())) throw new RuntimeException("宠物头像不能为空");
        if (isBlank(request.getType())) throw new RuntimeException("宠物类型不能为空");
        if (isBlank(request.getName())) throw new RuntimeException("宠物名字不能为空");
        if (isBlank(request.getAge())) throw new RuntimeException("宠物年龄不能为空");
        if (isBlank(request.getGender())) throw new RuntimeException("宠物性别不能为空");
        if (isBlank(request.getWeight())) throw new RuntimeException("宠物体重不能为空");
        if (isBlank(request.getBreed())) throw new RuntimeException("宠物品种不能为空");
    }

    private void fillPet(Pet pet, PetCreateRequest request) {
        pet.setUserId(request.getUserId());
        pet.setAvatarUrl(request.getAvatarUrl());
        pet.setType(request.getType());
        pet.setName(request.getName());
        pet.setAge(request.getAge());
        pet.setGender(request.getGender());
        pet.setWeight(request.getWeight());
        pet.setBreed(request.getBreed());
        pet.setHasAggression(request.getHasAggression() == null ? 0 : request.getHasAggression());
        pet.setVaccinated(request.getVaccinated() == null ? 1 : request.getVaccinated());
        pet.setIntro(request.getIntro());
        pet.setTagsJson(toJson(request.getTags()));
        pet.setAlbumJson(toJson(request.getAlbumList()));
    }

    private PetResponse toResponse(Pet pet) {
        PetResponse response = new PetResponse();
        response.setId(pet.getId());
        response.setUserId(pet.getUserId());
        response.setAvatarUrl(pet.getAvatarUrl());
        response.setType(pet.getType());
        response.setName(pet.getName());
        response.setAge(pet.getAge());
        response.setGender(pet.getGender());
        response.setWeight(pet.getWeight());
        response.setBreed(pet.getBreed());
        response.setHasAggression(pet.getHasAggression());
        response.setVaccinated(pet.getVaccinated());
        response.setIntro(pet.getIntro());
        response.setTags(toList(pet.getTagsJson()));
        response.setAlbumList(toList(pet.getAlbumJson()));
        return response;
    }

    private String toJson(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list == null ? Collections.emptyList() : list);
        } catch (Exception e) {
            return "[]";
        }
    }

    private List<String> toList(String json) {
        try {
            if (json == null || json.isBlank()) return Collections.emptyList();
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }
}