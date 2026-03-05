-- Add product audience field: men / women / kids

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS audience TEXT;

-- Backfill existing data (choose a safe default for old rows)
UPDATE products
SET audience = 'women'
WHERE audience IS NULL OR audience = '';

-- Enforce domain and defaults
ALTER TABLE products
  ALTER COLUMN audience SET DEFAULT 'women';

ALTER TABLE products
  ALTER COLUMN audience SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_audience_check'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_audience_check
      CHECK (audience IN ('men', 'women', 'kids'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_audience
  ON products(audience);
