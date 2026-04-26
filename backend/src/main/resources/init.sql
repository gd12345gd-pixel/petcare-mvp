CREATE DATABASE IF NOT EXISTS petcare_mvp DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE petcare_mvp;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS review;
DROP TABLE IF EXISTS service_record;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS sitter;
DROP TABLE IF EXISTS app_user;
DROP TABLE IF EXISTS service_item;
CREATE TABLE app_user (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nickname VARCHAR(50) NOT NULL,
  avatar VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS `user` (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(128) NOT NULL UNIQUE,
  unionid VARCHAR(128) DEFAULT NULL,
  session_key VARCHAR(128) DEFAULT NULL,
  nickname VARCHAR(50) DEFAULT '微信用户',
  avatar_url VARCHAR(255) DEFAULT '',
  phone VARCHAR(20) DEFAULT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'USER',
  sitter_status VARCHAR(20) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at DATETIME DEFAULT NULL,
  last_login_ip VARCHAR(64) DEFAULT NULL,
  last_login_user_agent VARCHAR(512) DEFAULT NULL,
  wx_login_raw VARCHAR(2048) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
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
CREATE TABLE sitter (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  real_name VARCHAR(50) NOT NULL,
  intro VARCHAR(255) DEFAULT NULL,
  years_of_experience INT NOT NULL DEFAULT 0,
  rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
  service_count INT NOT NULL DEFAULT 0,
  distance_km DECIMAL(5,2) NOT NULL DEFAULT 0,
  verified TINYINT(1) NOT NULL DEFAULT 1,
  video_record_enabled TINYINT(1) NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sitter_user FOREIGN KEY (user_id) REFERENCES app_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE service_item (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  unit_label VARCHAR(20) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  video_included TINYINT(1) NOT NULL DEFAULT 1,
  active TINYINT(1) NOT NULL DEFAULT 1,
  sort_no INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(32) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  sitter_id BIGINT DEFAULT NULL,
  service_item_id BIGINT NOT NULL,
  service_date DATE NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  address VARCHAR(255) NOT NULL,
  contact_name VARCHAR(50) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  note VARCHAR(255) DEFAULT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES app_user(id),
  CONSTRAINT fk_order_sitter FOREIGN KEY (sitter_id) REFERENCES sitter(id),
  CONSTRAINT fk_order_service FOREIGN KEY (service_item_id) REFERENCES service_item(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE service_record (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  record_type VARCHAR(20) NOT NULL DEFAULT 'VIDEO',
  media_url VARCHAR(255) NOT NULL,
  thumbnail_url VARCHAR(255) DEFAULT NULL,
  content TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_record_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE review (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  sitter_id BIGINT NOT NULL,
  rating INT NOT NULL,
  tags VARCHAR(255) DEFAULT NULL,
  content VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES app_user(id),
  CONSTRAINT fk_review_sitter FOREIGN KEY (sitter_id) REFERENCES sitter(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO app_user (id, nickname, avatar, phone, role) VALUES
(1, '奶糕主人', 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=300', '13800000001', 'CUSTOMER'),
(2, '小李', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300', '13800000002', 'SITTER'),
(3, '阿宁', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300', '13800000003', 'SITTER');
INSERT INTO sitter (id, user_id, real_name, intro, years_of_experience, rating, service_count, distance_km, verified, video_record_enabled, status) VALUES
(1, 2, '李晓雨', '养猫5年，耐心细致，擅长胆小猫照护。', 5, 4.9, 23, 2.3, 1, 1, 'ACTIVE'),
(2, 3, '安宁', '自养柴犬和英短，熟悉喂药、清理和简单陪玩。', 4, 5.0, 17, 3.1, 1, 1, 'ACTIVE');
INSERT INTO service_item (id, code, name, price, unit_label, description, video_included, active, sort_no) VALUES
(1, 'CAT_HOME_VISIT', '上门喂猫', 49.00, '次', '含喂食、换水、清理猫砂、简单互动、全程视频记录', 1, 1, 1),
(2, 'DOG_WALK', '上门遛狗', 69.00, '次', '含牵引遛狗、补水、简单清洁、全程视频记录', 1, 1, 2);
INSERT INTO orders (id, order_no, user_id, sitter_id, service_item_id, service_date, time_slot, address, contact_name, contact_phone, note, amount, status, payment_status) VALUES
(1, 'PC202603290001', 1, 1, 1, '2026-03-29', '09:30-10:00', '上海市宝林四村12号楼3单元302', '王女士', '13811112222', '猫咪有点怕生，先轻声沟通', 49.00, 'COMPLETED', 'PAID'),
(2, 'PC202603300001', 1, 2, 2, '2026-03-30', '18:00-18:30', '上海市徐汇区示例路88号', '刘先生', '13911112222', '柴犬见到陌生人比较兴奋', 69.00, 'CONFIRMED', 'PAID');
INSERT INTO service_record (order_id, record_type, media_url, thumbnail_url, content) VALUES
(1, 'VIDEO', 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=500', '到家开始录像'),
(1, 'IMAGE', 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=500', 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=500', '喂食完成'),
(1, 'IMAGE', 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=500', 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=500', '猫砂清理完成');
INSERT INTO review (order_id, user_id, sitter_id, rating, content) VALUES
(1, 1, 1, 5, '视频很安心，猫咪状态很好，下次还会继续找她。');
SET FOREIGN_KEY_CHECKS = 1;
