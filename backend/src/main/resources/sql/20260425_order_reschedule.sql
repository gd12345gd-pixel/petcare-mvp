-- 修改预约能力：用“生成新订单 + 关闭旧订单”的方式保留历史轨迹
-- original_order_id：记录改约链路的最初订单 ID，方便追溯
-- reschedule_count：记录当前链路已修改次数，仅用于历史追溯和展示分析
-- cancel_reason：记录旧订单关闭原因，例如“用户修改预约”

ALTER TABLE pet_order
  ADD COLUMN original_order_id BIGINT NULL COMMENT '改约链路的原始订单ID' AFTER source,
  ADD COLUMN reschedule_count INT NOT NULL DEFAULT 0 COMMENT '当前订单链路已修改预约次数' AFTER original_order_id,
  ADD COLUMN cancel_reason VARCHAR(255) NULL COMMENT '订单取消原因，含用户改约关闭旧单' AFTER reschedule_count;

CREATE INDEX idx_pet_order_original_order_id ON pet_order(original_order_id);
