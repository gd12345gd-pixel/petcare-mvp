-- 用户问题反馈表
-- 用途：承接小程序“问题反馈”表单，方便后台或数据库人工跟进。

CREATE TABLE IF NOT EXISTS user_feedback (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '反馈ID',
    user_id BIGINT NOT NULL COMMENT '提交反馈的用户ID',
    feedback_type VARCHAR(30) NOT NULL DEFAULT 'OTHER' COMMENT '反馈类型：ORDER/SITTER/PAYMENT/PRODUCT/OTHER',
    content VARCHAR(1000) NOT NULL COMMENT '问题描述',
    contact_phone VARCHAR(30) DEFAULT NULL COMMENT '用户希望客服联系的手机号',
    order_no VARCHAR(50) DEFAULT NULL COMMENT '关联订单号，选填',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '处理状态：PENDING/PROCESSING/DONE/CLOSED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    KEY idx_user_id (user_id),
    KEY idx_status_created_at (status, created_at)
) COMMENT='用户问题反馈表';
