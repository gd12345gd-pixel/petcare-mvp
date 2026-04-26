-- 修复评价表外键：review.order_id 应关联 pet_order.id，而不是 orders.id
-- 可重复执行：仅在当前外键引用 orders 时才会切换

SET @review_order_fk_name := (
  SELECT kcu.CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE kcu
  WHERE kcu.TABLE_SCHEMA = DATABASE()
    AND kcu.TABLE_NAME = 'review'
    AND kcu.COLUMN_NAME = 'order_id'
    AND kcu.REFERENCED_TABLE_NAME = 'orders'
  LIMIT 1
);

SET @sql_drop_fk := IF(
  @review_order_fk_name IS NOT NULL,
  CONCAT('ALTER TABLE review DROP FOREIGN KEY ', @review_order_fk_name),
  'SELECT 1'
);
PREPARE stmt_drop_fk FROM @sql_drop_fk;
EXECUTE stmt_drop_fk;
DEALLOCATE PREPARE stmt_drop_fk;

SET @has_fk_to_pet_order := (
  SELECT COUNT(*)
  FROM information_schema.KEY_COLUMN_USAGE kcu
  WHERE kcu.TABLE_SCHEMA = DATABASE()
    AND kcu.TABLE_NAME = 'review'
    AND kcu.COLUMN_NAME = 'order_id'
    AND kcu.REFERENCED_TABLE_NAME = 'pet_order'
);

SET @sql_add_fk := IF(
  @has_fk_to_pet_order = 0,
  'ALTER TABLE review ADD CONSTRAINT fk_review_order FOREIGN KEY (order_id) REFERENCES pet_order(id)',
  'SELECT 1'
);
PREPARE stmt_add_fk FROM @sql_add_fk;
EXECUTE stmt_add_fk;
DEALLOCATE PREPARE stmt_add_fk;
