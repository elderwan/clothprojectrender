-- Add logical delete flag (soft delete) to all tables
-- false = not deleted, true = deleted

ALTER TABLE categories      ADD COLUMN IF NOT EXISTS del_flg BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products        ADD COLUMN IF NOT EXISTS del_flg BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE product_images  ADD COLUMN IF NOT EXISTS del_flg BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users           ADD COLUMN IF NOT EXISTS del_flg BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE user_addresses  ADD COLUMN IF NOT EXISTS del_flg BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orders          ADD COLUMN IF NOT EXISTS del_flg BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE order_items     ADD COLUMN IF NOT EXISTS del_flg BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE cart_items      ADD COLUMN IF NOT EXISTS del_flg BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill (safe when column existed before)
UPDATE categories     SET del_flg = FALSE WHERE del_flg IS NULL;
UPDATE products       SET del_flg = FALSE WHERE del_flg IS NULL;
UPDATE product_images SET del_flg = FALSE WHERE del_flg IS NULL;
UPDATE users          SET del_flg = FALSE WHERE del_flg IS NULL;
UPDATE user_addresses SET del_flg = FALSE WHERE del_flg IS NULL;
UPDATE orders         SET del_flg = FALSE WHERE del_flg IS NULL;
UPDATE order_items    SET del_flg = FALSE WHERE del_flg IS NULL;
UPDATE cart_items     SET del_flg = FALSE WHERE del_flg IS NULL;

-- Ensure defaults + not null
ALTER TABLE categories      ALTER COLUMN del_flg SET DEFAULT FALSE;
ALTER TABLE products        ALTER COLUMN del_flg SET DEFAULT FALSE;
ALTER TABLE product_images  ALTER COLUMN del_flg SET DEFAULT FALSE;
ALTER TABLE users           ALTER COLUMN del_flg SET DEFAULT FALSE;
ALTER TABLE user_addresses  ALTER COLUMN del_flg SET DEFAULT FALSE;
ALTER TABLE orders          ALTER COLUMN del_flg SET DEFAULT FALSE;
ALTER TABLE order_items     ALTER COLUMN del_flg SET DEFAULT FALSE;
ALTER TABLE cart_items      ALTER COLUMN del_flg SET DEFAULT FALSE;

ALTER TABLE categories      ALTER COLUMN del_flg SET NOT NULL;
ALTER TABLE products        ALTER COLUMN del_flg SET NOT NULL;
ALTER TABLE product_images  ALTER COLUMN del_flg SET NOT NULL;
ALTER TABLE users           ALTER COLUMN del_flg SET NOT NULL;
ALTER TABLE user_addresses  ALTER COLUMN del_flg SET NOT NULL;
ALTER TABLE orders          ALTER COLUMN del_flg SET NOT NULL;
ALTER TABLE order_items     ALTER COLUMN del_flg SET NOT NULL;
ALTER TABLE cart_items      ALTER COLUMN del_flg SET NOT NULL;

-- cart_items unique key must include del_flg for soft-delete upsert logic
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_size_key;
ALTER TABLE cart_items ADD CONSTRAINT cart_items_user_id_product_id_size_del_flg_key
UNIQUE (user_id, product_id, size, del_flg);

-- indexes for common filters
CREATE INDEX IF NOT EXISTS idx_categories_del_flg      ON categories(del_flg);
CREATE INDEX IF NOT EXISTS idx_products_del_flg        ON products(del_flg);
CREATE INDEX IF NOT EXISTS idx_product_images_del_flg  ON product_images(del_flg);
CREATE INDEX IF NOT EXISTS idx_users_del_flg           ON users(del_flg);
CREATE INDEX IF NOT EXISTS idx_user_addresses_del_flg  ON user_addresses(del_flg);
CREATE INDEX IF NOT EXISTS idx_orders_del_flg          ON orders(del_flg);
CREATE INDEX IF NOT EXISTS idx_order_items_del_flg     ON order_items(del_flg);
CREATE INDEX IF NOT EXISTS idx_cart_items_del_flg      ON cart_items(del_flg);
