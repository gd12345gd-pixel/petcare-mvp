package com.example.petcare.service;

import com.example.petcare.dto.*;
import com.example.petcare.entity.FoundPet;
import com.example.petcare.entity.LostPet;
import com.example.petcare.entity.PetComment;
import com.example.petcare.entity.User;
import com.example.petcare.repository.FoundPetRepository;
import com.example.petcare.repository.LostPetRepository;
import com.example.petcare.repository.PetCommentRepository;
import com.example.petcare.repository.UserRepository;

import com.example.petcare.util.GeoUtil;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;

@Service
public class  PetCommunityService {

    private final LostPetRepository lostPetRepository;
    private final FoundPetRepository foundPetRepository;
    private final PetCommentRepository petCommentRepository;
    private final UserRepository userRepository;
    private final GeoCodeService geoCodeService;

    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public PetCommunityService(LostPetRepository lostPetRepository,
        FoundPetRepository foundPetRepository,
        PetCommentRepository petCommentRepository,
        UserRepository userRepository,
        GeoCodeService geoCodeService ) {
        this.lostPetRepository = lostPetRepository;
        this.foundPetRepository = foundPetRepository;
        this.petCommentRepository = petCommentRepository;
        this.userRepository = userRepository;
        this.geoCodeService = geoCodeService;
    }


    @Transactional
    public Long createLostPet(CreateLostPetRequest request) {
        if (request.getUserId() == null) {throw new RuntimeException("userId不能为空");}
        if (blank(request.getImageUrl())) {throw new RuntimeException("imageUrl不能为空");}
        if (blank(request.getLostLocation())) {throw new RuntimeException("丢失地点不能为空");}
        if (blank(request.getLostTime())) {throw new RuntimeException("丢失时间不能为空");}
        if (blank(request.getContact())) {throw new RuntimeException("联系方式不能为空");}

        LostPet entity = new LostPet();
        entity.setUserId(request.getUserId());
        entity.setPetName(request.getPetName());
        entity.setBreed(request.getBreed());
        entity.setImageUrl(request.getImageUrl());
        entity.setLostLocation(request.getLostLocation());
        entity.setLostTime(LocalDateTime.parse(request.getLostTime(), formatter));
        entity.setContact(request.getContact());
        entity.setRewardAmount(blank(request.getRewardAmount()) ? BigDecimal.ZERO : new BigDecimal(request.getRewardAmount()));
        entity.setDescription(request.getDescription());
        entity.setStatus("OPEN");
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        entity.setLatitude(request.getLatitude());
        entity.setLongitude(request.getLongitude());
        entity.setDistrict(entity.getDistrict());
        LocationRegionResult region =
            geoCodeService.reverseRegion(request.getLatitude(), request.getLongitude());

        entity.setProvince(region.getProvince());
        entity.setCity(region.getCity());
        entity.setDistrict(region.getDistrict());
        entity.setAdcode(region.getAdcode());
        return lostPetRepository.save(entity).getId();
    }


    @Transactional
    public Long createFoundPet(CreateFoundPetRequest request) {
        if (request.getUserId() == null) {throw new RuntimeException("userId不能为空");}
        if (blank(request.getImageUrl())) {throw new RuntimeException("imageUrl不能为空");}
        if (blank(request.getFoundLocation())) {throw new RuntimeException("发现地点不能为空");}
        if (blank(request.getFoundTime())) {throw new RuntimeException("发现时间不能为空");}
        if (blank(request.getContact())) {throw new RuntimeException("联系方式不能为空");}

        FoundPet entity = new FoundPet();
        entity.setUserId(request.getUserId());
        entity.setPetName(request.getPetName());
        entity.setBreed(request.getBreed());
        entity.setImageUrl(request.getImageUrl());
        entity.setFoundLocation(request.getFoundLocation());
        entity.setFoundTime(LocalDateTime.parse(request.getFoundTime(), formatter));
        entity.setContact(request.getContact());
        entity.setDescription(request.getDescription());
        entity.setTempCare(Boolean.TRUE.equals(request.getTempCare()));
        entity.setStatus("OPEN");
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        entity.setLatitude(request.getLatitude());
        entity.setLongitude(request.getLongitude());
        entity.setDistrict(entity.getDistrict());
        LocationRegionResult region =
            geoCodeService.reverseRegion(request.getLatitude(), request.getLongitude());

        entity.setProvince(region.getProvince());
        entity.setCity(region.getCity());
        entity.setDistrict(region.getDistrict());
        entity.setAdcode(region.getAdcode());
        return foundPetRepository.save(entity).getId();
    }



    public List<PetPostVO> listLostPets(String district) {
        if (district == null || district.isBlank() || "all".equalsIgnoreCase(district)) {
            return lostPetRepository.findByStatusOrderByCreatedAtDesc("OPEN")
                .stream()
                .map(this::toLostVO)
                .toList();
        }

        return lostPetRepository.findByStatusAndDistrictOrderByCreatedAtDesc("OPEN", district)
            .stream()
            .map(this::toLostVO)
            .toList();
    }



    public List<PetPostVO> listFoundPets(String district) {
        if (district == null || district.isBlank() || "all".equalsIgnoreCase(district)) {
            return foundPetRepository.findByStatusOrderByCreatedAtDesc("OPEN")
                .stream()
                .map(this::toFoundVO)
                .toList();
        }

        return foundPetRepository.findByStatusAndDistrictOrderByCreatedAtDesc("OPEN", district)
            .stream()
            .map(this::toFoundVO)
            .toList();
    }


    public PetPostVO getLostPetDetail(Long id) {
        LostPet entity = lostPetRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("寻宠信息不存在"));
        return toLostVO(entity);
    }


    public PetPostVO getFoundPetDetail(Long id) {
        FoundPet entity = foundPetRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("寻主信息不存在"));
        return toFoundVO(entity);
    }


    @Transactional
    public void createComment(CreatePetCommentRequest request) {
        if (request.getUserId() == null) throw new RuntimeException("userId不能为空");
        if (request.getTargetId() == null) throw new RuntimeException("targetId不能为空");
        if (blank(request.getTargetType())) throw new RuntimeException("targetType不能为空");
        if (blank(request.getContent())) throw new RuntimeException("评论内容不能为空");

        PetComment comment = new PetComment();
        comment.setUserId(request.getUserId());
        comment.setTargetId(request.getTargetId());
        comment.setTargetType(request.getTargetType());
        comment.setContent(request.getContent());
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());

        petCommentRepository.save(comment);
    }


    public List<PetCommentVO> listComments(String targetType, Long targetId) {
        return petCommentRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId)
            .stream()
            .map(item -> {
                User user = userRepository.findById(item.getUserId()).orElse(null);
                return PetCommentVO.builder()
                    .id(item.getId())
                    .userId(item.getUserId())
                    .nickname(user != null ? user.getNickname() : "微信用户")
                    .avatarUrl(user != null ? user.getAvatarUrl() : "")
                    .content(item.getContent())
                    .createdAt(item.getCreatedAt().format(formatter))
                    .build();
            })
            .toList();
    }



    private PetPostVO toFoundVO(FoundPet e) {
        return PetPostVO.builder()
            .id(e.getId())
            .type("FOUND")
            .petName(e.getPetName())
            .breed(e.getBreed())
            .imageUrl(e.getImageUrl())
            .district(e.getDistrict())
            .location(e.getFoundLocation())
            .timeText(e.getFoundTime() != null ? e.getFoundTime().format(formatter) : "")
            .rewardText("待认领")
            .description(e.getDescription())
            .contact(e.getContact())
            .tempCare(e.getTempCare())
            .status(e.getStatus())
            .latitude(e.getLatitude())
            .longitude(e.getLongitude())
            .build();
    }

    private boolean blank(String s) {
        return s == null || s.isBlank();
    }



    public List<PetPostVO> nearbyFoundPets(Double latitude, Double longitude, Double radiusKm) {
        if (latitude == null || longitude == null) {
            throw new RuntimeException("经纬度不能为空");
        }

        return foundPetRepository.findByStatusOrderByCreatedAtDesc("OPEN")
            .stream()
            .map(this::toFoundVO)
            .filter(item -> item.getLatitude() != null && item.getLongitude() != null)
            .peek(item -> {
                double distance = GeoUtil.distanceKm(
                    latitude,
                    longitude,
                    item.getLatitude(),
                    item.getLongitude()
                );
                item.setDistanceKm(distance);
                item.setDistanceText(GeoUtil.formatDistance(distance));
            })
            .filter(item -> radiusKm == null || radiusKm <= 0 || item.getDistanceKm() <= radiusKm)
            .sorted(Comparator.comparing(PetPostVO::getDistanceKm))
            .toList();
    }
    public List<PetPostVO> nearbyLostPets(Double latitude, Double longitude, Double radiusKm) {
        if (latitude == null || longitude == null) {
            throw new RuntimeException("经纬度不能为空");
        }

        return lostPetRepository.findByStatusOrderByCreatedAtDesc("OPEN")
            .stream()
            .map(this::toLostVO)
            .filter(item -> item.getLatitude() != null && item.getLongitude() != null)
            .peek(item -> {
                double distance = GeoUtil.distanceKm(
                    latitude,
                    longitude,
                    item.getLatitude(),
                    item.getLongitude()
                );
                item.setDistanceKm(distance);
                item.setDistanceText(GeoUtil.formatDistance(distance));
            })
            .filter(item -> radiusKm == null || radiusKm <= 0 || item.getDistanceKm() <= radiusKm)
            .sorted(Comparator.comparing(PetPostVO::getDistanceKm))
            .toList();
    }

    private PetPostVO toLostVO(LostPet e) {
        return PetPostVO.builder()
            .id(e.getId())
            .type("LOST")
            .petName(e.getPetName())
            .breed(e.getBreed())
            .imageUrl(e.getImageUrl())
            .location(e.getLostLocation())
            .timeText(e.getLostTime() != null ? e.getLostTime().format(formatter) : "")
            .rewardText(e.getRewardAmount() != null && e.getRewardAmount().compareTo(BigDecimal.ZERO) > 0
                ? "悬赏 " + e.getRewardAmount().stripTrailingZeros().toPlainString() + "元"
                : "无悬赏")
            .description(e.getDescription())
            .contact(e.getContact())
            .tempCare(null)
            .district(e.getDistrict())
            .status(e.getStatus())
            .latitude(e.getLatitude())
            .longitude(e.getLongitude())
            .build();
    }
}