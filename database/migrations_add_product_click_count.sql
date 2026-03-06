-- Add product click tracking and atomic increment function

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS click_count INT NOT NULL DEFAULT 0;

UPDATE products
SET click_count = 0
WHERE click_count IS NULL OR click_count < 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_click_count_check'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_click_count_check
      CHECK (click_count >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_click_count
  ON products(click_count DESC);

CREATE OR REPLACE FUNCTION increment_product_click_count(p_product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET click_count = click_count + 1
  WHERE id = p_product_id
    AND del_flg = FALSE;
END;
$$ LANGUAGE plpgsql;
