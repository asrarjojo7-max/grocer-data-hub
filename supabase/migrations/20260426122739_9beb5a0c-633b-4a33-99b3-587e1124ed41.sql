-- 1. Performance indexes for print_receipts
CREATE INDEX IF NOT EXISTS idx_print_receipts_user_created 
  ON public.print_receipts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_print_receipts_receipt_date 
  ON public.print_receipts (receipt_date DESC);

CREATE INDEX IF NOT EXISTS idx_print_receipts_branch_date 
  ON public.print_receipts (branch_id, receipt_date DESC);

CREATE INDEX IF NOT EXISTS idx_print_receipts_image_hash 
  ON public.print_receipts (image_hash) WHERE image_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_print_receipts_image_hashes_gin
  ON public.print_receipts USING GIN (image_hashes);

CREATE INDEX IF NOT EXISTS idx_print_receipts_whatsapp_from
  ON public.print_receipts (whatsapp_from_number) WHERE whatsapp_from_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_print_receipts_source_created
  ON public.print_receipts (source, created_at DESC);

-- 2. Profile phone lookup (designer matching by phone)
CREATE INDEX IF NOT EXISTS idx_profiles_phone 
  ON public.profiles (phone) WHERE phone IS NOT NULL;

-- 3. WhatsApp pending groups — aggregates multi-image receipts within a 90s window
CREATE TABLE IF NOT EXISTS public.whatsapp_pending_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id TEXT NOT NULL,
  from_number TEXT NOT NULL,
  chat_id TEXT,
  user_id UUID,
  branch_id UUID,
  sender_name TEXT,
  image_data_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_storage_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_hashes JSONB NOT NULL DEFAULT '[]'::jsonb,
  pages_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'collecting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wa_pending_lookup 
  ON public.whatsapp_pending_groups (instance_id, from_number, status, expires_at);

CREATE INDEX IF NOT EXISTS idx_wa_pending_expires 
  ON public.whatsapp_pending_groups (status, expires_at);

ALTER TABLE public.whatsapp_pending_groups ENABLE ROW LEVEL SECURITY;

-- Only the service role (server) writes/reads this. Authenticated users get nothing.
CREATE POLICY "Service role only access" 
ON public.whatsapp_pending_groups 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- updated_at trigger
DROP TRIGGER IF EXISTS update_wa_pending_updated_at ON public.whatsapp_pending_groups;
CREATE TRIGGER update_wa_pending_updated_at
  BEFORE UPDATE ON public.whatsapp_pending_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();