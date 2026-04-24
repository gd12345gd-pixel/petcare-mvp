package com.example.petcare.controller;

import com.example.petcare.auth.AuthContext;
import com.example.petcare.common.Result;
import com.example.petcare.dto.*;
import com.example.petcare.service.PetCommunityService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pet-community")
public class PetCommunityController {

    private final PetCommunityService petCommunityService;

    public PetCommunityController(PetCommunityService petCommunityService) {
        this.petCommunityService = petCommunityService;
    }

    @GetMapping("/lost/nearby")
    public Result<List<PetPostVO>> nearbyLost(@RequestParam Double latitude,
        @RequestParam Double longitude,
        @RequestParam(required = false) Double radiusKm) {
        return Result.success(petCommunityService.nearbyLostPets(latitude, longitude, radiusKm));
    }

    @GetMapping("/found/nearby")
    public Result<List<PetPostVO>> nearbyFound(@RequestParam Double latitude,
        @RequestParam Double longitude,
        @RequestParam(required = false) Double radiusKm) {
        return Result.success(petCommunityService.nearbyFoundPets(latitude, longitude, radiusKm));
    }

    @PostMapping("/lost")
    public Result<Map<String, Long>> createLost(@RequestBody CreateLostPetRequest request) {
        request.setUserId(AuthContext.requireCurrentUserId());
        Long id = petCommunityService.createLostPet(request);
        return Result.success(Map.of("id", id));
    }

    @PostMapping("/found")
    public Result<Map<String, Long>> createFound(@RequestBody CreateFoundPetRequest request) {
        request.setUserId(AuthContext.requireCurrentUserId());
        Long id = petCommunityService.createFoundPet(request);
        return Result.success(Map.of("id", id));
    }

    @GetMapping("/lost/list")
    public Result<List<PetPostVO>> listLost(@RequestParam(required = false) String district) {
        return Result.success(petCommunityService.listLostPets(district));
    }

    @GetMapping("/found/list")
    public Result<List<PetPostVO>> listFound(@RequestParam(required = false) String district) {
        return Result.success(petCommunityService.listFoundPets(district));
    }

    @GetMapping("/lost/detail/{id}")
    public Result<PetPostVO> lostDetail(@PathVariable Long id) {
        return Result.success(petCommunityService.getLostPetDetail(id));
    }

    @GetMapping("/found/detail/{id}")
    public Result<PetPostVO> foundDetail(@PathVariable Long id) {
        return Result.success(petCommunityService.getFoundPetDetail(id));
    }

    @PostMapping("/comments")
    public Result<Void> createComment(@RequestBody CreatePetCommentRequest request) {
        request.setUserId(AuthContext.requireCurrentUserId());
        petCommunityService.createComment(request);
        return Result.success(null);
    }

    @GetMapping("/comments")
    public Result<List<PetCommentVO>> listComments(@RequestParam String targetType,
        @RequestParam Long targetId) {
        return Result.success(petCommunityService.listComments(targetType, targetId));
    }
}
