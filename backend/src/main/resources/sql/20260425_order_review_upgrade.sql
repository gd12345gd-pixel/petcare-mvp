-- 订单评价升级：支持评价标签，并限制每个用户对同一订单只评价一次
-- 兼容已升级/未升级环境，可重复执行

SET @has_tags_col := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'review'
    AND COLUMN_NAME = 'tags'
);
SET @sql_add_tags := IF(
  @has_tags_col = 0,
  'ALTER TABLE review ADD COLUMN tags VARCHAR(255) NULL COMMENT ''评价标签，英文逗号分隔'' AFTER rating',
  'SELECT 1'
);
PREPARE stmt_add_tags FROM @sql_add_tags;
EXECUTE stmt_add_tags;
DEALLOCATE PREPARE stmt_add_tags;

SET @has_uk_review_order_user := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'review'
    AND INDEX_NAME = 'uk_review_order_user'
);
SET @sql_add_uk := IF(
  @has_uk_review_order_user = 0,
  'CREATE UNIQUE INDEX uk_review_order_user ON review(order_id, user_id)',
  'SELECT 1'
);
PREPARE stmt_add_uk FROM @sql_add_uk;
EXECUTE stmt_add_uk;
DEALLOCATE PREPARE stmt_add_uk;
