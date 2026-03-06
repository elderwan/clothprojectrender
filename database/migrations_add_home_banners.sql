-- Homepage banner settings table

CREATE TABLE IF NOT EXISTS home_banners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  image_url   TEXT NOT NULL,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  active_from TIMESTAMPTZ,
  active_to   TIMESTAMPTZ,
  del_flg     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE home_banners ADD COLUMN IF NOT EXISTS active_from TIMESTAMPTZ;
ALTER TABLE home_banners ADD COLUMN IF NOT EXISTS active_to   TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_home_banners_active
  ON home_banners(is_active);

CREATE INDEX IF NOT EXISTS idx_home_banners_del_flg
  ON home_banners(del_flg);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_home_banners_updated_at ON home_banners;
CREATE TRIGGER trg_home_banners_updated_at
  BEFORE UPDATE ON home_banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
