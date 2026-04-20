-- Types
CREATE TYPE public.whatsapp_connection_status AS ENUM ('connected', 'pending', 'disconnected');
CREATE TYPE public.app_role AS ENUM ('admin', 'accountant');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.branches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL, location text, phone text,
  is_active boolean DEFAULT true NOT NULL,
  default_price_per_meter numeric NOT NULL DEFAULT 300,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.whatsapp_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id uuid NOT NULL UNIQUE REFERENCES public.branches(id) ON DELETE CASCADE,
  phone_number text NOT NULL UNIQUE,
  whatsapp_business_id text, access_token text, webhook_verify_token text,
  status public.whatsapp_connection_status DEFAULT 'pending' NOT NULL,
  last_sync_at timestamptz, verification_code text, verification_expires_at timestamptz,
  connection_type text NOT NULL DEFAULT 'meta',
  green_api_instance_id text, green_api_token text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT check_connection_type CHECK (connection_type IN ('meta', 'green_api', 'manual'))
);
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.transfers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  whatsapp_connection_id uuid REFERENCES public.whatsapp_connections(id) ON DELETE SET NULL,
  amount numeric(15,2) NOT NULL,
  transfer_date date DEFAULT CURRENT_DATE NOT NULL,
  sender_name text, sender_phone text, image_url text, extracted_data jsonb,
  is_confirmed boolean DEFAULT false NOT NULL, confirmed_at timestamptz, notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.whatsapp_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp_connection_id uuid NOT NULL REFERENCES public.whatsapp_connections(id) ON DELETE CASCADE,
  message_id text NOT NULL UNIQUE,
  from_number text NOT NULL, message_type text NOT NULL,
  content text, media_url text,
  processed boolean DEFAULT false NOT NULL, processed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text, phone text,
  commission_percentage numeric NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.print_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  customer_name text,
  receipt_date date NOT NULL DEFAULT CURRENT_DATE,
  total_meters numeric NOT NULL DEFAULT 0,
  price_per_meter numeric NOT NULL DEFAULT 300,
  total_amount numeric NOT NULL DEFAULT 0,
  commission_percentage numeric NOT NULL DEFAULT 10,
  commission_amount numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  image_url text, extracted_data jsonb, ai_confidence integer, ai_notes text,
  is_confirmed boolean NOT NULL DEFAULT false, confirmed_at timestamptz, notes text,
  source text NOT NULL DEFAULT 'manual',
  whatsapp_from_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.print_receipts ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON public.transfers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_whatsapp_connections_updated_at BEFORE UPDATE ON public.whatsapp_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_print_receipts_updated_at BEFORE UPDATE ON public.print_receipts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Allow public read access to branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Allow public insert to branches" ON public.branches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to branches" ON public.branches FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to branches" ON public.branches FOR DELETE USING (true);
CREATE POLICY "Allow public read access to transfers" ON public.transfers FOR SELECT USING (true);
CREATE POLICY "Allow public insert to transfers" ON public.transfers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to transfers" ON public.transfers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to transfers" ON public.transfers FOR DELETE USING (true);
CREATE POLICY "Allow public read access to whatsapp_connections" ON public.whatsapp_connections FOR SELECT USING (true);
CREATE POLICY "Allow public insert to whatsapp_connections" ON public.whatsapp_connections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to whatsapp_connections" ON public.whatsapp_connections FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to whatsapp_connections" ON public.whatsapp_connections FOR DELETE USING (true);
CREATE POLICY "Allow public read access to whatsapp_messages" ON public.whatsapp_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert to whatsapp_messages" ON public.whatsapp_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins delete profiles" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Self insert accountant role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id AND role = 'accountant');

CREATE POLICY "Users view own receipts" ON public.print_receipts FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own receipts" ON public.print_receipts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own receipts" ON public.print_receipts FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users delete own receipts" ON public.print_receipts FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'accountant');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read receipts" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
CREATE POLICY "Auth users upload receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users update own receipt files" ON storage.objects FOR UPDATE USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own receipt files" ON storage.objects FOR DELETE USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

ALTER TABLE public.print_receipts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.print_receipts;

CREATE TABLE public.designer_whatsapp_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  phone_number text NOT NULL,
  green_api_instance_id text NOT NULL,
  green_api_token text NOT NULL,
  monitored_chat_id text, monitored_chat_name text,
  status text NOT NULL DEFAULT 'pending',
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.designer_whatsapp_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own link" ON public.designer_whatsapp_links FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users insert own link" ON public.designer_whatsapp_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own link" ON public.designer_whatsapp_links FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users delete own link" ON public.designer_whatsapp_links FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_designer_whatsapp_links_updated_at BEFORE UPDATE ON public.designer_whatsapp_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_dwl_instance ON public.designer_whatsapp_links(green_api_instance_id);
CREATE INDEX idx_dwl_chat ON public.designer_whatsapp_links(monitored_chat_id);