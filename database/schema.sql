-- =============================================================
-- MAISON Cloth Shop — Supabase Database Schema
-- Run this in Supabase SQL Editor to initialise the database.
-- =============================================================

-- ── DROP ALL TABLES (clean slate) ────────────────────────────
-- Must drop in reverse dependency order to avoid FK constraint errors.
DROP TABLE IF EXISTS wishlist_items  CASCADE;
DROP TABLE IF EXISTS cart_items      CASCADE;
DROP TABLE IF EXISTS order_items     CASCADE;
DROP TABLE IF EXISTS orders          CASCADE;
DROP TABLE IF EXISTS user_addresses  CASCADE;
DROP TABLE IF EXISTS home_banners    CASCADE;
DROP TABLE IF EXISTS product_images  CASCADE;
DROP TABLE IF EXISTS products        CASCADE;
DROP TABLE IF EXISTS categories      CASCADE;
DROP TABLE IF EXISTS users           CASCADE;

-- Drop the shared trigger function last
DROP FUNCTION IF EXISTS update_updated_at CASCADE;

-- ── 1. CATEGORIES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,          -- e.g. "Coats"
  slug       TEXT NOT NULL UNIQUE,          -- e.g. "coats"
  audience   TEXT NOT NULL DEFAULT 'women' CHECK (audience IN ('men', 'women', 'kids')),
  del_flg    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. PRODUCTS ──────────────────────────────────────────────
-- image_url removed: images are managed in product_images table
CREATE TABLE IF NOT EXISTS products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  description    TEXT,
  composition_care TEXT,
  price          NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
  audience       TEXT        NOT NULL DEFAULT 'women' CHECK (audience IN ('men', 'women', 'kids')),
  stock_quantity INT         NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  click_count    INT         NOT NULL DEFAULT 0 CHECK (click_count >= 0),
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  del_flg        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. PRODUCT IMAGES ────────────────────────────────────────
-- One product can have many images. is_primary marks the cover image.
CREATE TABLE IF NOT EXISTS product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt_text    TEXT,
  sort_order  INT  NOT NULL DEFAULT 0,      -- lower = shown first
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  del_flg     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. USERS ─────────────────────────────────────────────────
-- Stores application users (clients + admins).
-- role: 'client' | 'admin'
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  role          TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  del_flg       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. USER ADDRESSES ────────────────────────────────────────
-- A user can have many saved addresses. is_default = primary shipping address.
CREATE TABLE IF NOT EXISTS user_addresses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label         TEXT NOT NULL DEFAULT 'Home',  -- e.g. "Home", "Office"
  full_name     TEXT NOT NULL,                 -- recipient name
  phone         TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city          TEXT NOT NULL,
  state         TEXT,
  postal_code   TEXT NOT NULL,
  country       TEXT NOT NULL DEFAULT 'MY',
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  del_flg       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. ORDERS ────────────────────────────────────────────────
-- status: 'pending' | 'processing' | 'payed' | 'shipped' | 'delivered' | 'cancelled'
CREATE TABLE IF NOT EXISTS orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_id   UUID REFERENCES user_addresses(id) ON DELETE SET NULL,
  shipping_label TEXT,
  shipping_full_name TEXT,
  shipping_phone TEXT,
  shipping_address_line1 TEXT,
  shipping_address_line2 TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','processing','payed','shipped','delivered','cancelled')),
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  del_flg      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. ORDER ITEMS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity    INT  NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),  -- snapshot at purchase time
  size        TEXT,                                             -- 'XS','S','M','L','XL'
  del_flg     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 8. CART ITEMS ────────────────────────────────────────────
-- Server-side cart keyed by user_id. Guest carts use session only.
CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INT  NOT NULL DEFAULT 1 CHECK (quantity > 0),
  size        TEXT,
  del_flg     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id, size, del_flg)   -- one active row per user+product+size combo
);

-- ── 9. HOMEPAGE BANNERS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  del_flg     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id, del_flg)
);

-- ── 10. HOMEPAGE BANNERS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS home_banners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  image_url   TEXT NOT NULL,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  banner_kind TEXT NOT NULL DEFAULT 'category' CHECK (banner_kind IN ('home', 'category')),
  audience_scope TEXT CHECK (audience_scope IN ('men', 'women', 'kids')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  active_from TIMESTAMPTZ,
  active_to   TIMESTAMPTZ,
  del_flg     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_category       ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active      ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_audience       ON products(audience);
CREATE INDEX IF NOT EXISTS idx_products_click_count    ON products(click_count DESC);
CREATE INDEX IF NOT EXISTS idx_categories_del_flg      ON categories(del_flg);
CREATE INDEX IF NOT EXISTS idx_categories_audience     ON categories(audience);
CREATE INDEX IF NOT EXISTS idx_products_del_flg        ON products(del_flg);
CREATE INDEX IF NOT EXISTS idx_product_images_product  ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary  ON product_images(product_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_product_images_del_flg  ON product_images(del_flg);
CREATE INDEX IF NOT EXISTS idx_users_del_flg           ON users(del_flg);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user     ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_default  ON user_addresses(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_user_addresses_del_flg  ON user_addresses(del_flg);
CREATE INDEX IF NOT EXISTS idx_orders_user_id          ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status           ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_del_flg          ON orders(del_flg);
CREATE INDEX IF NOT EXISTS idx_order_items_order       ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_del_flg     ON order_items(del_flg);
CREATE INDEX IF NOT EXISTS idx_cart_items_user         ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_del_flg      ON cart_items(del_flg);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user     ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_del_flg  ON wishlist_items(del_flg);
CREATE INDEX IF NOT EXISTS idx_home_banners_active     ON home_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_home_banners_del_flg    ON home_banners(del_flg);
CREATE INDEX IF NOT EXISTS idx_home_banners_kind       ON home_banners(banner_kind);
CREATE INDEX IF NOT EXISTS idx_home_banners_audience_scope ON home_banners(audience_scope);

-- ── AUTO-UPDATE updated_at ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_product_click_count(p_product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET click_count = click_count + 1
  WHERE id = p_product_id
    AND del_flg = FALSE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_demo_revenue_total()
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(total_amount), 0)
  FROM orders
  WHERE del_flg = FALSE
    AND status NOT IN ('processing', 'cancelled');
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION create_demo_order_with_inventory(
  p_user_id UUID,
  p_address_id UUID,
  p_items JSONB
)
RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_total NUMERIC(10, 2);
  v_item RECORD;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User is required.';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty.';
  END IF;

  FOR v_item IN
    SELECT grouped.product_id, grouped.quantity, product.stock_quantity, product.is_active, product.del_flg
    FROM (
      SELECT
        (item.product_id)::UUID AS product_id,
        SUM(item.quantity)::INT AS quantity
      FROM jsonb_to_recordset(p_items) AS item(product_id TEXT, quantity INT, size TEXT)
      GROUP BY (item.product_id)::UUID
    ) AS grouped
    JOIN products AS product
      ON product.id = grouped.product_id
    FOR UPDATE OF product
  LOOP
    IF v_item.quantity IS NULL OR v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid item quantity.';
    END IF;

    IF v_item.del_flg OR NOT v_item.is_active THEN
      RAISE EXCEPTION 'Some products are no longer available.';
    END IF;

    IF COALESCE(v_item.stock_quantity, 0) < v_item.quantity THEN
      RAISE EXCEPTION 'Some products are out of stock or do not have enough quantity. Please adjust your cart and try again.';
    END IF;
  END LOOP;

  SELECT COALESCE(SUM(product.price * grouped.quantity), 0)
  INTO v_total
  FROM (
    SELECT
      (item.product_id)::UUID AS product_id,
      SUM(item.quantity)::INT AS quantity
    FROM jsonb_to_recordset(p_items) AS item(product_id TEXT, quantity INT, size TEXT)
    GROUP BY (item.product_id)::UUID
  ) AS grouped
  JOIN products AS product
    ON product.id = grouped.product_id;

  INSERT INTO orders (user_id, address_id, total_amount, status, del_flg)
  VALUES (p_user_id, p_address_id, v_total, 'processing', FALSE)
  RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, quantity, unit_price, size, del_flg)
  SELECT
    v_order_id,
    (item.product_id)::UUID,
    item.quantity,
    product.price,
    NULLIF(item.size, ''),
    FALSE
  FROM jsonb_to_recordset(p_items) AS item(product_id TEXT, quantity INT, size TEXT)
  JOIN products AS product
    ON product.id = (item.product_id)::UUID;

  UPDATE products AS product
  SET stock_quantity = product.stock_quantity - grouped.quantity
  FROM (
    SELECT
      (item.product_id)::UUID AS product_id,
      SUM(item.quantity)::INT AS quantity
    FROM jsonb_to_recordset(p_items) AS item(product_id TEXT, quantity INT, size TEXT)
    GROUP BY (item.product_id)::UUID
  ) AS grouped
  WHERE product.id = grouped.product_id;

  DELETE FROM cart_items
  WHERE user_id = p_user_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_user_addresses_updated_at
  BEFORE UPDATE ON user_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_home_banners_updated_at
  BEFORE UPDATE ON home_banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── SEED: CATEGORIES ─────────────────────────────────────────
INSERT INTO categories (name, slug) VALUES
  ('Coats',       'coats'),
  ('Dresses',     'dresses'),
  ('Tops',        'tops'),
  ('Trousers',    'trousers'),
  ('Accessories', 'accessories'),
  ('Knitwear',    'knitwear'),
  ('Shoes',       'shoes')
ON CONFLICT (slug) DO NOTHING;

-- ── SEED: ADMIN USER ─────────────────────────────────────────
-- password: admin123 (bcrypt hash — change in production!)
INSERT INTO users (email, password_hash, full_name, role) VALUES
  ('admin@maison.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;


-- ── 3. USERS ─────────────────────────────────────────────────
-- Stores application users (clients + admins).
-- role: 'client' | 'admin'
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  role          TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  del_flg       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. ORDERS ────────────────────────────────────────────────
-- status: 'pending' | 'processing' | 'payed' | 'shipped' | 'delivered' | 'cancelled'
CREATE TABLE IF NOT EXISTS orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_id   UUID REFERENCES user_addresses(id) ON DELETE SET NULL,
  shipping_label TEXT,
  shipping_full_name TEXT,
  shipping_phone TEXT,
  shipping_address_line1 TEXT,
  shipping_address_line2 TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','processing','payed','shipped','delivered','cancelled')),
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  del_flg      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. ORDER ITEMS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity    INT  NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),  -- snapshot at purchase time
  size        TEXT,                                             -- 'XS','S','M','L','XL'
  del_flg     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. CART ITEMS ────────────────────────────────────────────
-- Server-side cart keyed by user_id. Guest carts use session only.
CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INT  NOT NULL DEFAULT 1 CHECK (quantity > 0),
  size        TEXT,
  del_flg     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id, size, del_flg)   -- one active row per user+product+size combo
);

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active  ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_audience   ON products(audience);
CREATE INDEX IF NOT EXISTS idx_categories_del_flg  ON categories(del_flg);
CREATE INDEX IF NOT EXISTS idx_categories_audience ON categories(audience);
CREATE INDEX IF NOT EXISTS idx_products_del_flg    ON products(del_flg);
CREATE INDEX IF NOT EXISTS idx_orders_user_id      ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders(status);
CREATE INDEX IF NOT EXISTS idx_users_del_flg       ON users(del_flg);
CREATE INDEX IF NOT EXISTS idx_orders_del_flg      ON orders(del_flg);
CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_del_flg ON order_items(del_flg);
CREATE INDEX IF NOT EXISTS idx_cart_items_user     ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_del_flg  ON cart_items(del_flg);
CREATE INDEX IF NOT EXISTS idx_home_banners_active ON home_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_home_banners_del_flg ON home_banners(del_flg);

-- ── AUTO-UPDATE updated_at ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_wishlist_items_updated_at
  BEFORE UPDATE ON wishlist_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_home_banners_updated_at
  BEFORE UPDATE ON home_banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── SEED: CATEGORIES ─────────────────────────────────────────
INSERT INTO categories (name, slug) VALUES
  ('Coats',       'coats'),
  ('Dresses',     'dresses'),
  ('Tops',        'tops'),
  ('Trousers',    'trousers'),
  ('Accessories', 'accessories'),
  ('Knitwear',    'knitwear'),
  ('Shoes',       'shoes')
ON CONFLICT (slug) DO NOTHING;

-- ── SEED: ADMIN USER ─────────────────────────────────────────
-- password: admin123 (bcrypt hash — change in production!)
INSERT INTO users (email, password_hash, full_name, role) VALUES
  ('admin@maison.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;
