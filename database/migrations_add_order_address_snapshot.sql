ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_label TEXT,
  ADD COLUMN IF NOT EXISTS shipping_full_name TEXT,
  ADD COLUMN IF NOT EXISTS shipping_phone TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS shipping_city TEXT,
  ADD COLUMN IF NOT EXISTS shipping_state TEXT,
  ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS shipping_country TEXT;

UPDATE orders AS o
SET
  shipping_label = ua.label,
  shipping_full_name = ua.full_name,
  shipping_phone = ua.phone,
  shipping_address_line1 = ua.address_line1,
  shipping_address_line2 = ua.address_line2,
  shipping_city = ua.city,
  shipping_state = ua.state,
  shipping_postal_code = ua.postal_code,
  shipping_country = ua.country
FROM user_addresses AS ua
WHERE o.address_id = ua.id
  AND o.del_flg = FALSE
  AND ua.del_flg = FALSE
  AND (
    o.shipping_full_name IS NULL
    OR o.shipping_address_line1 IS NULL
    OR o.shipping_city IS NULL
    OR o.shipping_postal_code IS NULL
    OR o.shipping_country IS NULL
  );
