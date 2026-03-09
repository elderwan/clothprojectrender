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
