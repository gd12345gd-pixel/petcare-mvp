ALTER TABLE `user`
  ADD COLUMN session_key VARCHAR(128) DEFAULT NULL AFTER unionid,
  ADD COLUMN last_login_ip VARCHAR(64) DEFAULT NULL AFTER last_login_at,
  ADD COLUMN last_login_user_agent VARCHAR(512) DEFAULT NULL AFTER last_login_ip,
  ADD COLUMN wx_login_raw VARCHAR(2048) DEFAULT NULL AFTER last_login_user_agent;

CREATE TABLE IF NOT EXISTS user_login_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  openid VARCHAR(128) DEFAULT NULL,
  login_type VARCHAR(40) NOT NULL DEFAULT 'WECHAT_MINIAPP',
  ip_address VARCHAR(64) DEFAULT NULL,
  user_agent VARCHAR(512) DEFAULT NULL,
  device_brand VARCHAR(80) DEFAULT NULL,
  device_model VARCHAR(120) DEFAULT NULL,
  system_info VARCHAR(120) DEFAULT NULL,
  platform VARCHAR(40) DEFAULT NULL,
  sdk_version VARCHAR(40) DEFAULT NULL,
  app_version VARCHAR(40) DEFAULT NULL,
  raw_device_info VARCHAR(512) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_login_log_user_id (user_id),
  INDEX idx_user_login_log_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
