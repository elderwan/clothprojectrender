CREATE OR REPLACE FUNCTION get_demo_revenue_total()
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(total_amount), 0)
  FROM orders
  WHERE del_flg = FALSE
    AND status NOT IN ('processing', 'cancelled');
$$ LANGUAGE SQL STABLE;
