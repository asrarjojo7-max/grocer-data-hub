-- Add duplicate detection and multi-page support to print_receipts
ALTER TABLE public.print_receipts
  ADD COLUMN IF NOT EXISTS image_hash text,
  ADD COLUMN IF NOT EXISTS image_hashes jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS image_urls jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pages_count integer NOT NULL DEFAULT 1;

-- Fast lookup for duplicate detection scoped per user
CREATE INDEX IF NOT EXISTS idx_print_receipts_user_hash
  ON public.print_receipts (user_id, image_hash);

-- GIN index for searching within hashes array (multi-page receipts)
CREATE INDEX IF NOT EXISTS idx_print_receipts_image_hashes
  ON public.print_receipts USING GIN (image_hashes);