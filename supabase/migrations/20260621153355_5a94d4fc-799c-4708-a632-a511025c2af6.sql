
-- ============ BRANCHES ============
DROP POLICY IF EXISTS "Allow public delete to branches" ON public.branches;
DROP POLICY IF EXISTS "Allow public insert to branches" ON public.branches;
DROP POLICY IF EXISTS "Allow public read access to branches" ON public.branches;
DROP POLICY IF EXISTS "Allow public update to branches" ON public.branches;

CREATE POLICY "Authenticated read branches" ON public.branches
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert branches" ON public.branches
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update branches" ON public.branches
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete branches" ON public.branches
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ TRANSFERS ============
DROP POLICY IF EXISTS "Allow public delete to transfers" ON public.transfers;
DROP POLICY IF EXISTS "Allow public insert to transfers" ON public.transfers;
DROP POLICY IF EXISTS "Allow public read access to transfers" ON public.transfers;
DROP POLICY IF EXISTS "Allow public update to transfers" ON public.transfers;

CREATE POLICY "Staff view transfers" ON public.transfers
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));
CREATE POLICY "Staff insert transfers" ON public.transfers
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));
CREATE POLICY "Staff update transfers" ON public.transfers
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));
CREATE POLICY "Admins delete transfers" ON public.transfers
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ WHATSAPP_CONNECTIONS ============
DROP POLICY IF EXISTS "Allow public delete to whatsapp_connections" ON public.whatsapp_connections;
DROP POLICY IF EXISTS "Allow public insert to whatsapp_connections" ON public.whatsapp_connections;
DROP POLICY IF EXISTS "Allow public read access to whatsapp_connections" ON public.whatsapp_connections;
DROP POLICY IF EXISTS "Allow public update to whatsapp_connections" ON public.whatsapp_connections;

CREATE POLICY "Admins read whatsapp_connections" ON public.whatsapp_connections
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert whatsapp_connections" ON public.whatsapp_connections
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update whatsapp_connections" ON public.whatsapp_connections
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete whatsapp_connections" ON public.whatsapp_connections
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ============ WHATSAPP_MESSAGES ============
DROP POLICY IF EXISTS "Allow public insert to whatsapp_messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Allow public read access to whatsapp_messages" ON public.whatsapp_messages;

CREATE POLICY "Staff read whatsapp_messages" ON public.whatsapp_messages
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- ============ USER_ROLES privilege escalation ============
DROP POLICY IF EXISTS "Self insert accountant role" ON public.user_roles;

-- ============ PRINT_RECEIPTS — require user_id ============
UPDATE public.print_receipts SET user_id = '00000000-0000-0000-0000-000000000000'::uuid WHERE user_id IS NULL;
ALTER TABLE public.print_receipts ALTER COLUMN user_id SET NOT NULL;
