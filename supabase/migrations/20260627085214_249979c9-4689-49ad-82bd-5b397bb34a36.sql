
CREATE INDEX IF NOT EXISTS idx_print_receipts_user_receipt_date
  ON public.print_receipts (user_id, receipt_date DESC);

CREATE INDEX IF NOT EXISTS idx_print_receipts_pending
  ON public.print_receipts (created_at DESC) WHERE is_confirmed = false;

CREATE OR REPLACE FUNCTION public.get_designer_month_stats(p_user_id uuid)
RETURNS TABLE (
  meters_month numeric,
  commission_month numeric,
  count_month bigint,
  meters_today numeric,
  commission_today numeric,
  count_today bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH r AS (
    SELECT total_meters, commission_amount, receipt_date
    FROM public.print_receipts
    WHERE user_id = p_user_id
      AND receipt_date >= date_trunc('month', now())::date
  )
  SELECT
    COALESCE(SUM(total_meters), 0),
    COALESCE(SUM(commission_amount), 0),
    COUNT(*),
    COALESCE(SUM(total_meters) FILTER (WHERE receipt_date >= current_date), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE receipt_date >= current_date), 0),
    COUNT(*) FILTER (WHERE receipt_date >= current_date)
  FROM r;
$$;

GRANT EXECUTE ON FUNCTION public.get_designer_month_stats(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_dashboard_month_stats()
RETURNS TABLE (
  meters_month numeric,
  amount_month numeric,
  commission_month numeric,
  net_month numeric,
  count_month bigint,
  meters_today numeric,
  amount_today numeric,
  commission_today numeric,
  net_today numeric,
  count_today bigint,
  pending_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH r AS (
    SELECT total_meters, total_amount, commission_amount, net_amount, is_confirmed, receipt_date
    FROM public.print_receipts
    WHERE receipt_date >= date_trunc('month', now())::date
  )
  SELECT
    COALESCE(SUM(total_meters), 0),
    COALESCE(SUM(total_amount), 0),
    COALESCE(SUM(commission_amount), 0),
    COALESCE(SUM(net_amount), 0),
    COUNT(*),
    COALESCE(SUM(total_meters) FILTER (WHERE receipt_date >= current_date), 0),
    COALESCE(SUM(total_amount) FILTER (WHERE receipt_date >= current_date), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE receipt_date >= current_date), 0),
    COALESCE(SUM(net_amount) FILTER (WHERE receipt_date >= current_date), 0),
    COUNT(*) FILTER (WHERE receipt_date >= current_date),
    COUNT(*) FILTER (WHERE is_confirmed = false)
  FROM r;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_month_stats() TO authenticated;
