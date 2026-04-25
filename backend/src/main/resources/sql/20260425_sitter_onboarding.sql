-- 接单师入驻申请字段迁移脚本
-- 用途：支撑“申请 -> 认证 -> 审核 -> 交押金 -> 可接单”的 MVP 流程。
-- 执行前提：已存在 sitter_profile、sitter_level_rule、sitter_deposit_rule 等基础表。

ALTER TABLE sitter_profile
    ADD COLUMN real_name VARCHAR(50) NULL COMMENT '真实姓名，用于平台人工审核',
    ADD COLUMN phone VARCHAR(30) NULL COMMENT '接单师联系电话',
    ADD COLUMN gender VARCHAR(20) NULL COMMENT '性别：MALE/FEMALE/UNKNOWN 或前端展示值',
    ADD COLUMN age INT NULL COMMENT '年龄',
    ADD COLUMN city VARCHAR(100) NULL COMMENT '所在城市',
    ADD COLUMN service_area VARCHAR(255) NULL COMMENT '可服务区域，如区县/商圈/小区描述',
    ADD COLUMN pet_types VARCHAR(50) NULL COMMENT '可服务宠物：CAT/DOG/BOTH',
    ADD COLUMN experience VARCHAR(50) NULL COMMENT '服务经验：NONE/LESS_THAN_1_YEAR/1_TO_3_YEARS/OVER_3_YEARS',
    ADD COLUMN has_pet_experience TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否养过宠物：0否 1是',
    ADD COLUMN available_times VARCHAR(100) NULL COMMENT '可服务时间段，多个值用英文逗号分隔：MORNING,AFTERNOON,EVENING,ALL_DAY',
    ADD COLUMN introduction VARCHAR(1000) NULL COMMENT '个人简介',
    ADD COLUMN id_card_no VARCHAR(30) NULL COMMENT '身份证号，仅用于平台审核',
    ADD COLUMN id_card_front_url VARCHAR(500) NULL COMMENT '身份证正面照片 URL',
    ADD COLUMN id_card_back_url VARCHAR(500) NULL COMMENT '身份证反面照片 URL',
    ADD COLUMN certificate_url VARCHAR(500) NULL COMMENT '资质证书 URL，选填',
    ADD COLUMN reject_reason VARCHAR(500) NULL COMMENT '审核拒绝原因',
    ADD COLUMN submitted_at DATETIME NULL COMMENT '最近一次提交审核时间',
    ADD COLUMN audited_at DATETIME NULL COMMENT '最近一次审核时间',
    ADD COLUMN audited_by BIGINT NULL COMMENT '审核人用户ID';

-- 确保默认规则符合第一版 MVP：L0 每天 1 单，完成 2 单升 L1，押金 99 元。
INSERT INTO sitter_level_rule
(level_code, level_name, daily_order_limit, required_completed_orders, required_credit_score, allow_no_show, enabled, sort_order)
VALUES
    ('L0', '新手托托师', 1, 0, 80, FALSE, TRUE, 0),
    ('L1', '初级托托师', 2, 2, 80, FALSE, TRUE, 1)
ON DUPLICATE KEY UPDATE
    level_name = VALUES(level_name),
    daily_order_limit = VALUES(daily_order_limit),
    required_completed_orders = VALUES(required_completed_orders),
    required_credit_score = VALUES(required_credit_score),
    allow_no_show = VALUES(allow_no_show),
    enabled = VALUES(enabled),
    sort_order = VALUES(sort_order);

INSERT INTO sitter_deposit_rule
(rule_name, deposit_amount, required_for_accept_order, refundable_when_no_active_order, enabled)
SELECT '基础押金', 99.00, TRUE, TRUE, TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM sitter_deposit_rule WHERE rule_name = '基础押金' AND enabled = TRUE
);

-- 管理员设置示例：
-- 将指定用户设为审核管理员后，可访问 /api/admin/sitters 系列接口。
-- UPDATE user SET role = 'ADMIN' WHERE id = 你的用户ID;
