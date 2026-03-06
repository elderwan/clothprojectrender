-- Add product composition & care field

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS composition_care TEXT;
