-- Bind each category to one audience (men/women/kids)

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS audience TEXT;

-- Backfill from existing products where possible
UPDATE categories c
SET audience = x.audience
FROM (
  SELECT category_id, MAX(audience) AS audience
  FROM products
  WHERE category_id IS NOT NULL
  GROUP BY category_id
) x
WHERE c.id = x.category_id
  AND (c.audience IS NULL OR c.audience = '');

-- Fallback default
UPDATE categories
SET audience = 'women'
WHERE audience IS NULL OR audience = '';

ALTER TABLE categories
  ALTER COLUMN audience SET DEFAULT 'women';

ALTER TABLE categories
  ALTER COLUMN audience SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'categories_audience_check'
  ) THEN
    ALTER TABLE categories
      ADD CONSTRAINT categories_audience_check
      CHECK (audience IN ('men', 'women', 'kids'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_categories_audience
  ON categories(audience);

-- Keep product audience in sync with linked category
UPDATE products p
SET audience = c.audience
FROM categories c
WHERE p.category_id = c.id;
