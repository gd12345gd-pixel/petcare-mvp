package com.example.petcare.service;

import com.example.petcare.dto.SitterApplyRequest;
import com.example.petcare.dto.SitterGrowthResponse;
import com.example.petcare.dto.SitterProfileResponse;
import com.example.petcare.dto.SitterRuleResponse;
import com.example.petcare.entity.SitterCancelPenaltyRule;
import com.example.petcare.entity.SitterDepositRule;
import com.example.petcare.entity.SitterLevelRule;
import com.example.petcare.entity.SitterProfile;
import com.example.petcare.entity.SitterGrowthLog;
import com.example.petcare.entity.User;
import com.example.petcare.repository.SitterCancelPenaltyRuleRepository;
import com.example.petcare.repository.SitterDepositRuleRepository;
import com.example.petcare.repository.SitterLevelRuleRepository;
import com.example.petcare.repository.PetOrderRepository;
import com.example.petcare.repository.SitterGrowthLogRepository;
import com.example.petcare.repository.SitterProfileRepository;
import com.example.petcare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SitterProfileService {

    private final SitterProfileRepository sitterProfileRepository;
    private final SitterLevelRuleRepository levelRuleRepository;
    private final SitterDepositRuleRepository depositRuleRepository;
    private final SitterCancelPenaltyRuleRepository cancelPenaltyRuleRepository;
    private final PetOrderRepository petOrderRepository;
    private final SitterGrowthLogRepository sitterGrowthLogRepository;
    private final SitterDepositService sitterDepositService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public SitterProfileResponse getMe(Long userId) {
        return sitterProfileRepository.findByUserId(userId)
                .map(this::toResponse)
                .orElseGet(() -> {
                    SitterProfileResponse response = new SitterProfileResponse();
                    response.setUserId(userId);
                    response.setAuditStatus("NOT_SUBMITTED");
                    response.setDepositStatus("NONE");
                    response.setCreditScore(100);
                    response.setLevelCode("L0");
                    response.setLevelName("新手托托师");
                    response.setDailyOrderLimit(1);
                    response.setCanAcceptOrder(false);
                    response.setNextAction("APPLY");
                    return response;
                });
    }

    @Transactional
    public SitterProfileResponse apply(Long userId, SitterApplyRequest request) {
        SitterProfile sitter = sitterProfileRepository.findByUserId(userId)
                .orElseGet(() -> newProfile(userId));

        if ("PENDING".equals(sitter.getAuditStatus())) {
            throw new RuntimeException("资料正在审核中，请勿重复提交");
        }
        if ("APPROVED".equals(sitter.getAuditStatus())) {
            throw new RuntimeException("资料已审核通过，无需重复申请");
        }

        fillApplication(sitter, request);
        sitter.setAuditStatus("PENDING");
        sitter.setRejectReason(null);
        sitter.setSubmittedAt(LocalDateTime.now());
        sitter.setAuditedAt(null);
        sitter.setAuditedBy(null);
        sitter.setUpdatedAt(LocalDateTime.now());

        updateUserSitterStatus(userId, "PENDING");
        return toResponse(sitterProfileRepository.save(sitter));
    }

    @Transactional
    public SitterProfileResponse resubmit(Long userId, SitterApplyRequest request) {
        SitterProfile sitter = sitterProfileRepository.findByUserId(userId)
                .orElseGet(() -> newProfile(userId));

        if ("APPROVED".equals(sitter.getAuditStatus())) {
            throw new RuntimeException("资料已审核通过，无需重新提交");
        }

        fillApplication(sitter, request);
        sitter.setAuditStatus("PENDING");
        sitter.setRejectReason(null);
        sitter.setSubmittedAt(LocalDateTime.now());
        sitter.setAuditedAt(null);
        sitter.setAuditedBy(null);
        sitter.setUpdatedAt(LocalDateTime.now());

        updateUserSitterStatus(userId, "PENDING");
        return toResponse(sitterProfileRepository.save(sitter));
    }

    public List<SitterProfileResponse> listForAdmin(String auditStatus) {
        List<SitterProfile> sitters;
        if (auditStatus == null || auditStatus.isBlank()) {
            sitters = sitterProfileRepository.findAllByOrderBySubmittedAtDesc();
        } else {
            sitters = sitterProfileRepository.findByAuditStatusOrderBySubmittedAtDesc(auditStatus);
        }
        return sitters.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public SitterProfileResponse getForAdmin(Long id) {
        return toResponse(sitterProfileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("接单师申请不存在")));
    }

    @Transactional
    public SitterProfileResponse approve(Long id, Long auditorUserId) {
        SitterProfile sitter = sitterProfileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("接单师申请不存在"));
        if (!"PENDING".equals(sitter.getAuditStatus())) {
            throw new RuntimeException("只有审核中的申请可以通过");
        }

        sitter.setAuditStatus("APPROVED");
        sitter.setRejectReason(null);
        sitter.setAuditedAt(LocalDateTime.now());
        sitter.setAuditedBy(auditorUserId);
        sitter.setUpdatedAt(LocalDateTime.now());

        updateUserSitterStatus(sitter.getUserId(), "APPROVED");
        SitterProfile saved = sitterProfileRepository.save(sitter);
        notificationService.create(
                saved.getUserId(),
                "SITTER",
                "接单师审核通过",
                "恭喜，你的接单师资料已审核通过。缴纳押金后即可开始接单。",
                "SITTER_PROFILE",
                saved.getId(),
                "/pages/sitter/register/index"
        );
        return toResponse(saved);
    }

    @Transactional
    public SitterProfileResponse reject(Long id, Long auditorUserId, String rejectReason) {
        if (rejectReason == null || rejectReason.isBlank()) {
            throw new RuntimeException("请填写审核拒绝原因");
        }

        SitterProfile sitter = sitterProfileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("接单师申请不存在"));
        if (!"PENDING".equals(sitter.getAuditStatus())) {
            throw new RuntimeException("只有审核中的申请可以拒绝");
        }

        sitter.setAuditStatus("REJECTED");
        sitter.setRejectReason(rejectReason.trim());
        sitter.setAuditedAt(LocalDateTime.now());
        sitter.setAuditedBy(auditorUserId);
        sitter.setUpdatedAt(LocalDateTime.now());

        updateUserSitterStatus(sitter.getUserId(), "REJECTED");
        SitterProfile saved = sitterProfileRepository.save(sitter);
        notificationService.create(
                saved.getUserId(),
                "SITTER",
                "接单师审核未通过",
                "你的接单师申请未通过，原因：" + saved.getRejectReason(),
                "SITTER_PROFILE",
                saved.getId(),
                "/pages/sitter/register/index"
        );
        return toResponse(saved);
    }

    @Transactional
    public SitterProfileResponse payDeposit(Long userId) {
        SitterProfile sitter = sitterProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("请先注册成为接单师"));
        if (!"APPROVED".equals(sitter.getAuditStatus())) {
            throw new RuntimeException("资料审核通过后才能缴纳押金");
        }
        sitterDepositService.payDeposit(userId);
        updateUserSitterStatus(userId, "ACTIVE");
        return getMe(userId);
    }

    @Transactional
    public SitterProfileResponse refundDeposit(Long userId) {
        sitterDepositService.requestRefundDeposit(userId);
        return getMe(userId);
    }

    public SitterRuleResponse rules() {
        SitterRuleResponse response = new SitterRuleResponse();
        response.setLevelRules(levelRuleRepository.findByEnabledTrueOrderBySortOrderAsc());
        response.setDepositRule(depositRuleRepository.findFirstByEnabledTrueOrderByIdDesc().orElse(null));
        response.setCancelPenaltyRules(cancelPenaltyRuleRepository.findByEnabledTrueOrderBySortOrderAsc());
        return response;
    }

    public SitterGrowthResponse growth(Long userId) {
        SitterProfile sitter = sitterProfileRepository.findByUserId(userId).orElseGet(() -> newProfile(userId));
        List<SitterLevelRule> rules = levelRuleRepository.findByEnabledTrueOrderBySortOrderAsc();
        Optional<SitterLevelRule> currentRuleOpt = levelRuleRepository.findByLevelCodeAndEnabledTrue(sitter.getLevelCode());
        SitterLevelRule currentRule = currentRuleOpt.orElseGet(() -> {
            SitterLevelRule fallback = new SitterLevelRule();
            fallback.setLevelCode("L0");
            fallback.setLevelName("新手托托师");
            fallback.setDailyOrderLimit(1);
            fallback.setRequiredCompletedOrders(0);
            fallback.setSortOrder(0);
            return fallback;
        });

        SitterLevelRule nextRule = null;
        for (SitterLevelRule rule : rules) {
            if (rule.getSortOrder() != null
                    && currentRule.getSortOrder() != null
                    && rule.getSortOrder() > currentRule.getSortOrder()) {
                nextRule = rule;
                break;
            }
        }

        Integer completedOrders = safeInt(sitter.getCompletedOrders());
        Integer todayAcceptedCount = 0;
        if (sitter.getId() != null) {
            LocalDateTime todayStart = java.time.LocalDate.now().atStartOfDay();
            todayAcceptedCount = petOrderRepository.countTodayAcceptedOrders(
                    sitter.getId(),
                    todayStart,
                    todayStart.plusDays(1)
            );
        }

        SitterGrowthResponse response = new SitterGrowthResponse();
        response.setLevelCode(currentRule.getLevelCode());
        response.setLevelName(currentRule.getLevelName());
        response.setDailyOrderLimit(safeInt(currentRule.getDailyOrderLimit()));
        response.setTodayAcceptedCount(todayAcceptedCount);
        response.setCreditScore(safeInt(sitter.getCreditScore()));
        response.setCompletedOrders(completedOrders);
        response.setGrowthValue(completedOrders);

        if (nextRule == null) {
            response.setNextGrowthValue(completedOrders);
            response.setGrowthPercent(100);
            response.setRemainToUpgrade(0);
            response.setNextLevelCode(currentRule.getLevelCode());
            response.setNextDailyOrderLimit(safeInt(currentRule.getDailyOrderLimit()));
            response.setMaxLevel(true);
        } else {
            int nextGrowth = Math.max(completedOrders, safeInt(nextRule.getRequiredCompletedOrders()));
            int remain = Math.max(0, nextGrowth - completedOrders);
            int currentFloor = Math.max(0, safeInt(currentRule.getRequiredCompletedOrders()));
            int denom = Math.max(1, nextGrowth - currentFloor);
            int percent = (int) Math.round((Math.max(0, completedOrders - currentFloor) * 100.0) / denom);
            response.setNextGrowthValue(nextGrowth);
            response.setGrowthPercent(Math.max(0, Math.min(100, percent)));
            response.setRemainToUpgrade(remain);
            response.setNextLevelCode(nextRule.getLevelCode());
            response.setNextDailyOrderLimit(safeInt(nextRule.getDailyOrderLimit()));
            response.setMaxLevel(false);
        }

        if (sitter.getId() != null) {
            List<SitterGrowthResponse.GrowthRecordItem> records = sitterGrowthLogRepository
                    .findTop20BySitterIdOrderByIdDesc(sitter.getId())
                    .stream()
                    .map(this::toGrowthRecord)
                    .collect(Collectors.toList());
            response.setRecords(records);
        } else {
            response.setRecords(new java.util.ArrayList<>());
        }
        return response;
    }

    public void requireAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException("无审核权限");
        }
    }

    private SitterProfile newProfile(Long userId) {
        SitterProfile sitter = new SitterProfile();
        sitter.setUserId(userId);
        sitter.setLevelCode("L0");
        sitter.setCreditScore(100);
        sitter.setDepositStatus("NONE");
        sitter.setDepositAmount(BigDecimal.ZERO);
        sitter.setCompletedOrders(0);
        sitter.setNoShowCount(0);
        sitter.setCancelCount(0);
        sitter.setAuditStatus("NOT_SUBMITTED");
        sitter.setCreatedAt(LocalDateTime.now());
        sitter.setUpdatedAt(LocalDateTime.now());
        return sitter;
    }

    private void fillApplication(SitterProfile sitter, SitterApplyRequest request) {
        requireText(request.getRealName(), "真实姓名不能为空");
        requireText(request.getPhone(), "手机号不能为空");
        requireText(request.getServiceArea(), "服务区域不能为空");
        requireText(request.getIntroduction(), "个人简介不能为空");
        requireText(request.getIdCardNo(), "身份证号不能为空");
        requireText(request.getIdCardFrontUrl(), "请上传身份证正面照片");
        requireText(request.getIdCardBackUrl(), "请上传身份证反面照片");

        sitter.setRealName(request.getRealName().trim());
        sitter.setPhone(request.getPhone().trim());
        sitter.setGender(trimToNull(request.getGender()));
        sitter.setAge(request.getAge());
        sitter.setCity(trimToNull(request.getCity()));
        sitter.setServiceArea(request.getServiceArea().trim());
        sitter.setPetTypes(trimToNull(request.getPetTypes()));
        sitter.setExperience(trimToNull(request.getExperience()));
        sitter.setHasPetExperience(Boolean.TRUE.equals(request.getHasPetExperience()));
        sitter.setAvailableTimes(trimToNull(request.getAvailableTimes()));
        sitter.setIntroduction(request.getIntroduction().trim());
        sitter.setIdCardNo(request.getIdCardNo().trim());
        sitter.setIdCardFrontUrl(request.getIdCardFrontUrl().trim());
        sitter.setIdCardBackUrl(request.getIdCardBackUrl().trim());
        sitter.setCertificateUrl(trimToNull(request.getCertificateUrl()));
    }

    private SitterProfileResponse toResponse(SitterProfile sitter) {
        SitterProfileResponse response = new SitterProfileResponse();
        response.setId(sitter.getId());
        response.setUserId(sitter.getUserId());
        response.setRealName(sitter.getRealName());
        response.setPhone(sitter.getPhone());
        response.setGender(sitter.getGender());
        response.setAge(sitter.getAge());
        response.setCity(sitter.getCity());
        response.setServiceArea(sitter.getServiceArea());
        response.setPetTypes(sitter.getPetTypes());
        response.setExperience(sitter.getExperience());
        response.setHasPetExperience(sitter.getHasPetExperience());
        response.setAvailableTimes(sitter.getAvailableTimes());
        response.setIntroduction(sitter.getIntroduction());
        response.setIdCardNo(sitter.getIdCardNo());
        response.setIdCardFrontUrl(sitter.getIdCardFrontUrl());
        response.setIdCardBackUrl(sitter.getIdCardBackUrl());
        response.setCertificateUrl(sitter.getCertificateUrl());
        response.setLevelCode(sitter.getLevelCode());
        response.setCreditScore(sitter.getCreditScore());
        response.setDepositStatus(sitter.getDepositStatus());
        response.setDepositAmount(sitter.getDepositAmount());
        response.setCompletedOrders(sitter.getCompletedOrders());
        response.setNoShowCount(sitter.getNoShowCount());
        response.setCancelCount(sitter.getCancelCount());
        response.setAuditStatus(sitter.getAuditStatus());
        response.setRejectReason(sitter.getRejectReason());
        response.setSubmittedAt(sitter.getSubmittedAt());
        response.setAuditedAt(sitter.getAuditedAt());
        response.setAuditedBy(sitter.getAuditedBy());
        response.setCreatedAt(sitter.getCreatedAt());
        response.setUpdatedAt(sitter.getUpdatedAt());

        Optional<SitterLevelRule> levelRule = levelRuleRepository.findByLevelCodeAndEnabledTrue(sitter.getLevelCode());
        response.setLevelName(levelRule.map(SitterLevelRule::getLevelName).orElse("新手托托师"));
        response.setDailyOrderLimit(levelRule.map(SitterLevelRule::getDailyOrderLimit).orElse(1));
        response.setCanAcceptOrder(canAcceptOrder(sitter));
        response.setNextAction(nextAction(sitter));
        return response;
    }

    private boolean canAcceptOrder(SitterProfile sitter) {
        return "APPROVED".equals(sitter.getAuditStatus())
                && ("PAID".equals(sitter.getDepositStatus()) || "LOCKED".equals(sitter.getDepositStatus()))
                && sitter.getCreditScore() != null
                && sitter.getCreditScore() >= 70;
    }

    private String nextAction(SitterProfile sitter) {
        if (sitter.getAuditStatus() == null || "NOT_SUBMITTED".equals(sitter.getAuditStatus())) {
            return "APPLY";
        }
        if ("PENDING".equals(sitter.getAuditStatus())) {
            return "WAIT_AUDIT";
        }
        if ("REJECTED".equals(sitter.getAuditStatus())) {
            return "RESUBMIT";
        }
        if (!"PAID".equals(sitter.getDepositStatus()) && !"LOCKED".equals(sitter.getDepositStatus())) {
            return "PAY_DEPOSIT";
        }
        return "ACCEPT_ORDER";
    }

    private void updateUserSitterStatus(Long userId, String sitterStatus) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setSitterStatus(sitterStatus);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        });
    }

    private void requireText(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new RuntimeException(message);
        }
    }

    private Integer safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private SitterGrowthResponse.GrowthRecordItem growthRecord(Integer value, String desc) {
        SitterGrowthResponse.GrowthRecordItem item = new SitterGrowthResponse.GrowthRecordItem();
        item.setValue(value);
        item.setDesc(desc);
        return item;
    }

    private SitterGrowthResponse.GrowthRecordItem toGrowthRecord(SitterGrowthLog log) {
        SitterGrowthResponse.GrowthRecordItem item = new SitterGrowthResponse.GrowthRecordItem();
        item.setValue(safeInt(log.getChangeValue()));
        item.setDesc(log.getDescription());
        return item;
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }

}
