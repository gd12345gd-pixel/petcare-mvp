-- 用户站内消息通知表
-- 用途：承接订单状态、审核结果、反馈处理等站内通知。

CREATE TABLE IF NOT EXISTS user_notification (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '通知ID',
    user_id BIGINT NOT NULL COMMENT '接收通知的用户ID',
    notice_type VARCHAR(30) NOT NULL DEFAULT 'SYSTEM' COMMENT '通知类型：SYSTEM/ORDER/SITTER/FEEDBACK',
    title VARCHAR(100) NOT NULL COMMENT '通知标题',
    content VARCHAR(1000) NOT NULL COMMENT '通知内容',
    target_type VARCHAR(30) DEFAULT NULL COMMENT '关联对象类型：ORDER/SITTER_PROFILE/FEEDBACK 等',
    target_id BIGINT DEFAULT NULL COMMENT '关联对象ID',
    target_url VARCHAR(500) DEFAULT NULL COMMENT '小程序跳转路径，选填',
    read_flag TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已读：0未读 1已读',
    read_at DATETIME DEFAULT NULL COMMENT '已读时间',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    KEY idx_user_read_created (user_id, read_flag, created_at),
    KEY idx_user_created (user_id, created_at)
) COMMENT='用户站内消息通知表';
