ALTER TABLE public.profiles ALTER COLUMN commission_per_meter SET DEFAULT 300;
ALTER TABLE public.print_receipts ALTER COLUMN commission_per_meter SET DEFAULT 300;

UPDATE public.profiles
SET commission_per_meter = 300,
    updated_at = now()
WHERE commission_per_meter = 10;

CREATE OR REPLACE FUNCTION public.apply_profile_commission_to_receipt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission_per_meter numeric;
BEGIN
  SELECT p.commission_per_meter
    INTO v_commission_per_meter
  FROM public.profiles p
  WHERE p.id = NEW.user_id;

  NEW.total_meters := COALESCE(NEW.total_meters, 0);
  NEW.price_per_meter := COALESCE(NEW.price_per_meter, 300);
  NEW.total_amount := COALESCE(NEW.total_amount, NEW.total_meters * NEW.price_per_meter, 0);
  NEW.commission_per_meter := COALESCE(v_commission_per_meter, NEW.commission_per_meter, 300);
  NEW.commission_amount := NEW.total_meters * NEW.commission_per_meter;
  NEW.net_amount := NEW.total_amount - NEW.commission_amount;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_profile_commission_to_receipt ON public.print_receipts;
CREATE TRIGGER apply_profile_commission_to_receipt
BEFORE INSERT OR UPDATE OF user_id, total_meters, price_per_meter, total_amount, commission_per_meter
ON public.print_receipts
FOR EACH ROW
EXECUTE FUNCTION public.apply_profile_commission_to_receipt();

CREATE OR REPLACE FUNCTION public.recalculate_receipts_after_profile_commission_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.commission_per_meter IS DISTINCT FROM OLD.commission_per_meter THEN
    UPDATE public.print_receipts
    SET commission_per_meter = NEW.commission_per_meter,
        commission_amount = total_meters * NEW.commission_per_meter,
        net_amount = total_amount - (total_meters * NEW.commission_per_meter),
        updated_at = now()
    WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recalculate_receipts_after_profile_commission_update ON public.profiles;
CREATE TRIGGER recalculate_receipts_after_profile_commission_update
AFTER UPDATE OF commission_per_meter
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_receipts_after_profile_commission_update();

UPDATE public.print_receipts r
SET commission_per_meter = p.commission_per_meter,
    commission_amount = r.total_meters * p.commission_per_meter,
    net_amount = r.total_amount - (r.total_meters * p.commission_per_meter),
    updated_at = now()
FROM public.profiles p
WHERE r.user_id = p.id
  AND r.commission_per_meter IS DISTINCT FROM p.commission_per_meter;