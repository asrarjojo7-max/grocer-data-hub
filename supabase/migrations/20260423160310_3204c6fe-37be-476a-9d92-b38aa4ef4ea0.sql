-- Device push tokens for Capacitor push notifications
CREATE TABLE public.device_push_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'android',
  device_info JSONB,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (token)
);

CREATE INDEX idx_device_push_tokens_user_id ON public.device_push_tokens(user_id);

ALTER TABLE public.device_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tokens"
  ON public.device_push_tokens FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users insert own tokens"
  ON public.device_push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own tokens"
  ON public.device_push_tokens FOR UPDATE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users delete own tokens"
  ON public.device_push_tokens FOR DELETE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_device_push_tokens_updated_at
  BEFORE UPDATE ON public.device_push_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
