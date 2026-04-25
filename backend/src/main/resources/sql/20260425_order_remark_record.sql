-- 订单照护备注时间线：补充说明只新增不覆盖，便于追溯和避免纠纷
CREATE TABLE IF NOT EXISTS order_remark_record (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '备注记录ID',
  order_id BIGINT NOT NULL COMMENT '订单ID',
  user_id BIGINT NOT NULL COMMENT '提交用户ID',
  submitter_type VARCHAR(32) NOT NULL DEFAULT 'USER' COMMENT '提交人类型：USER/ADMIN',
  content VARCHAR(100) NOT NULL COMMENT '补充说明内容，最多100字',
  image_urls_json JSON DEFAULT NULL COMMENT '补充图片URL数组，最多3张',
  hidden INT NOT NULL DEFAULT 0 COMMENT '平台隐藏标记：0展示，1隐藏',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
  INDEX idx_order_remark_order_id (order_id),
  INDEX idx_order_remark_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单补充备注记录表';
