REVOKE ALL ON FUNCTION public.apply_profile_commission_to_receipt() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_profile_commission_to_receipt() FROM anon;
REVOKE ALL ON FUNCTION public.apply_profile_commission_to_receipt() FROM authenticated;
REVOKE ALL ON FUNCTION public.recalculate_receipts_after_profile_commission_update() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recalculate_receipts_after_profile_commission_update() FROM anon;
REVOKE ALL ON FUNCTION public.recalculate_receipts_after_profile_commission_update() FROM authenticated;