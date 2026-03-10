ALTER TABLE home_banners
  ADD COLUMN IF NOT EXISTS banner_kind TEXT NOT NULL DEFAULT 'category'
    CHECK (banner_kind IN ('home', 'category'));

ALTER TABLE home_banners
  ADD COLUMN IF NOT EXISTS audience_scope TEXT
    CHECK (audience_scope IN ('men', 'women', 'kids'));

CREATE INDEX IF NOT EXISTS idx_home_banners_kind
  ON home_banners(banner_kind);

CREATE INDEX IF NOT EXISTS idx_home_banners_audience_scope
  ON home_banners(audience_scope);
