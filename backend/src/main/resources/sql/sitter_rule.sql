CREATE TABLE sitter_profile (
                                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                user_id BIGINT NOT NULL COMMENT '用户ID',

                                level_code VARCHAR(20) NOT NULL DEFAULT 'L0' COMMENT '等级编码',
                                credit_score INT NOT NULL DEFAULT 100 COMMENT '信誉分',

                                deposit_status VARCHAR(20) NOT NULL DEFAULT 'NONE' COMMENT 'NONE/PAID/LOCKED/REFUNDING/REFUNDED',
                                deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '当前押金金额',

                                completed_orders INT NOT NULL DEFAULT 0 COMMENT '已完成订单数',
                                no_show_count INT NOT NULL DEFAULT 0 COMMENT '未履约次数',
                                cancel_count INT NOT NULL DEFAULT 0 COMMENT '取消次数',

                                audit_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING/APPROVED/REJECTED',

                                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                                UNIQUE KEY uk_user_id (user_id)
);

CREATE TABLE sitter_level_rule (
                                   id BIGINT PRIMARY KEY AUTO_INCREMENT,

                                   level_code VARCHAR(20) NOT NULL COMMENT 'L0/L1/L2/L3',
                                   level_name VARCHAR(50) NOT NULL COMMENT '新手托托师/初级托托师等',

                                   daily_order_limit INT NOT NULL COMMENT '每日可接单数',
                                   required_completed_orders INT NOT NULL COMMENT '升级所需完成订单数',
                                   required_credit_score INT NOT NULL DEFAULT 80 COMMENT '升级所需最低信誉分',
                                   allow_no_show BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否允许有未履约记录',

                                   enabled BOOLEAN NOT NULL DEFAULT TRUE,
                                   sort_order INT NOT NULL DEFAULT 0,

                                   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                   updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                                   UNIQUE KEY uk_level_code (level_code)
);

INSERT INTO sitter_level_rule
(level_code, level_name, daily_order_limit, required_completed_orders, required_credit_score, allow_no_show, sort_order)
VALUES
    ('L0', '新手托托师', 1, 0, 80, FALSE, 0),
    ('L1', '初级托托师', 2, 2, 80, FALSE, 1),
    ('L2', '熟练托托师', 3, 5, 80, FALSE, 2),
    ('L3', '优质托托师', 5, 15, 80, FALSE, 3);


CREATE TABLE sitter_deposit_rule (
                                     id BIGINT PRIMARY KEY AUTO_INCREMENT,

                                     rule_name VARCHAR(50) NOT NULL COMMENT '基础押金',
                                     deposit_amount DECIMAL(10,2) NOT NULL COMMENT '押金金额',
                                     required_for_accept_order BOOLEAN NOT NULL DEFAULT TRUE COMMENT '接单是否必须缴纳',
                                     refundable_when_no_active_order BOOLEAN NOT NULL DEFAULT TRUE COMMENT '无进行中订单是否可退',

                                     enabled BOOLEAN NOT NULL DEFAULT TRUE,

                                     created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                     updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


INSERT INTO sitter_deposit_rule
(rule_name, deposit_amount, required_for_accept_order, refundable_when_no_active_order, enabled)
VALUES
    ('基础押金', 99.00, TRUE, TRUE, TRUE);



CREATE TABLE sitter_cancel_penalty_rule (
                                            id BIGINT PRIMARY KEY AUTO_INCREMENT,

                                            rule_name VARCHAR(100) NOT NULL COMMENT '提前24小时取消/2小时内取消等',

                                            min_hours_before_start DECIMAL(10,2) DEFAULT NULL COMMENT '距离服务开始最小小时数',
                                            max_hours_before_start DECIMAL(10,2) DEFAULT NULL COMMENT '距离服务开始最大小时数',

                                            credit_change INT NOT NULL DEFAULT 0 COMMENT '信誉分变化，扣分为负数',
                                            deposit_penalty_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '扣押金金额',

                                            downgrade_to_level VARCHAR(20) DEFAULT NULL COMMENT '是否降级到某等级',
                                            ban_sitter BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否封禁',

                                            enabled BOOLEAN NOT NULL DEFAULT TRUE,
                                            sort_order INT NOT NULL DEFAULT 0,

                                            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO sitter_cancel_penalty_rule
(rule_name, min_hours_before_start, max_hours_before_start, credit_change, deposit_penalty_amount, downgrade_to_level, ban_sitter, sort_order)
VALUES
    ('服务前24小时以上取消', 24, NULL, 0, 0.00, NULL, FALSE, 1),
    ('服务前6-24小时取消', 6, 24, -5, 0.00, NULL, FALSE, 2),
    ('服务前2-6小时取消', 2, 6, -10, 20.00, NULL, FALSE, 3),
    ('服务前2小时内取消', 0, 2, -20, 50.00, NULL, FALSE, 4);


CREATE TABLE sitter_no_show_rule (
                                     id BIGINT PRIMARY KEY AUTO_INCREMENT,

                                     rule_name VARCHAR(100) NOT NULL,

                                     credit_change INT NOT NULL DEFAULT -40,
                                     deposit_penalty_amount DECIMAL(10,2) NOT NULL DEFAULT 99.00,
                                     downgrade_to_level VARCHAR(20) DEFAULT 'L0',

                                     max_no_show_before_ban INT NOT NULL DEFAULT 2 COMMENT '累计几次未履约后封禁',
                                     enabled BOOLEAN NOT NULL DEFAULT TRUE,

                                     created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                     updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


INSERT INTO sitter_no_show_rule
(rule_name, credit_change, deposit_penalty_amount, downgrade_to_level, max_no_show_before_ban, enabled)
VALUES
    ('未上门/失联处罚规则', -40, 99.00, 'L0', 2, TRUE);

CREATE TABLE sitter_penalty_record (
                                       id BIGINT PRIMARY KEY AUTO_INCREMENT,

                                       sitter_id BIGINT NOT NULL,
                                       order_id BIGINT DEFAULT NULL,

                                       penalty_type VARCHAR(30) NOT NULL COMMENT 'CANCEL/NO_SHOW/COMPLAINT',
                                       reason VARCHAR(255),

                                       credit_change INT NOT NULL DEFAULT 0,
                                       deposit_penalty_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,

                                       before_credit_score INT,
                                       after_credit_score INT,

                                       before_deposit_amount DECIMAL(10,2),
                                       after_deposit_amount DECIMAL(10,2),

                                       created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

