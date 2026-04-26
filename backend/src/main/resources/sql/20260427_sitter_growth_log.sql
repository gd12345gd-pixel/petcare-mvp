-- 接单师成长流水表：用于“我的成长”页面展示真实记录

CREATE TABLE IF NOT EXISTS sitter_growth_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sitter_id BIGINT NOT NULL,
  order_id BIGINT NULL,
  change_value INT NOT NULL COMMENT '成长值变动，正数增加，负数扣减',
  change_type VARCHAR(32) NOT NULL COMMENT '变动类型：ORDER_COMPLETED/REVIEW_RECEIVED/NO_SHOW/CANCEL',
  description VARCHAR(255) NOT NULL COMMENT '前端展示描述',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sitter_growth_log_sitter_created (sitter_id, created_at DESC),
  INDEX idx_sitter_growth_log_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
