-- ============================================================
-- MuraTravel — RLS Policies (Row Level Security)
-- Multi-tenant isolation stricte par company_id
-- ============================================================

-- Helper: récupère le company_id de l'utilisateur connecté
CREATE OR REPLACE FUNCTION get_current_company_id()
RETURNS INTEGER AS $$
  SELECT company_id FROM public.users WHERE supabase_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: vérifie si l'utilisateur est super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE supabase_id = auth.uid() AND role = 'super_admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: vérifie si l'utilisateur est admin de la compagnie
CREATE OR REPLACE FUNCTION is_company_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE supabase_id = auth.uid() AND role IN ('super_admin', 'company_admin')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- TABLE: companies
-- ============================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_select" ON public.companies
  FOR SELECT USING (
    is_super_admin() OR id = get_current_company_id()
  );

CREATE POLICY "companies_insert" ON public.companies
  FOR INSERT WITH CHECK (is_super_admin());

CREATE POLICY "companies_update" ON public.companies
  FOR UPDATE USING (
    is_super_admin() OR (id = get_current_company_id() AND is_company_admin())
  );

CREATE POLICY "companies_delete" ON public.companies
  FOR DELETE USING (is_super_admin());

-- ============================================================
-- TABLE: users
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (
    is_super_admin()
    OR company_id = get_current_company_id()
    OR supabase_id = auth.uid()
  );

CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (
    is_super_admin() OR (is_company_admin() AND company_id = get_current_company_id())
  );

CREATE POLICY "users_update" ON public.users
  FOR UPDATE USING (
    is_super_admin()
    OR (is_company_admin() AND company_id = get_current_company_id())
    OR supabase_id = auth.uid()
  );

CREATE POLICY "users_delete" ON public.users
  FOR DELETE USING (
    is_super_admin() OR (is_company_admin() AND company_id = get_current_company_id())
  );

-- ============================================================
-- TABLE: agencies
-- ============================================================
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agencies_isolation" ON public.agencies
  FOR ALL USING (
    is_super_admin() OR company_id = get_current_company_id()
  );

-- ============================================================
-- TABLE: destinations
-- ============================================================
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "destinations_isolation" ON public.destinations
  FOR ALL USING (
    is_super_admin() OR company_id = get_current_company_id()
  );

-- ============================================================
-- TABLE: vehicles
-- ============================================================
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicles_isolation" ON public.vehicles
  FOR ALL USING (
    is_super_admin() OR company_id = get_current_company_id()
  );

-- ============================================================
-- TABLE: trips
-- ============================================================
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trips_isolation" ON public.trips
  FOR ALL USING (
    is_super_admin() OR company_id = get_current_company_id()
  );

-- ============================================================
-- TABLE: reservations
-- ============================================================
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Les agents voient les réservations de leur compagnie
-- Les clients peuvent voir leurs propres réservations via ticket_code
CREATE POLICY "reservations_staff" ON public.reservations
  FOR ALL USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = reservations.trip_id
      AND t.company_id = get_current_company_id()
    )
  );

-- ============================================================
-- TABLE: baggage
-- ============================================================
ALTER TABLE public.baggage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "baggage_isolation" ON public.baggage
  FOR ALL USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.reservations r
      JOIN public.trips t ON t.id = r.trip_id
      WHERE r.id = baggage.reservation_id
      AND t.company_id = get_current_company_id()
    )
  );

-- ============================================================
-- TABLE: payments
-- ============================================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_isolation" ON public.payments
  FOR ALL USING (
    is_super_admin() OR company_id = get_current_company_id()
  );

-- ============================================================
-- TABLE: incidents
-- ============================================================
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "incidents_isolation" ON public.incidents
  FOR ALL USING (
    is_super_admin() OR company_id = get_current_company_id()
  );

-- ============================================================
-- TABLE: transactions (journal de caisse)
-- ============================================================
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_isolation" ON public.transactions
  FOR ALL USING (
    is_super_admin() OR company_id = get_current_company_id()
  );

-- ============================================================
-- TABLE: notifications
-- ============================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_isolation" ON public.notifications
  FOR ALL USING (
    is_super_admin() OR company_id = get_current_company_id()
  );

CREATE POLICY "notification_config_isolation" ON public.notification_config
  FOR ALL USING (
    is_super_admin() OR company_id = get_current_company_id()
  );

-- ============================================================
-- TABLE: audit_logs
-- ============================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent lire les logs
CREATE POLICY "audit_logs_read" ON public.audit_logs
  FOR SELECT USING (
    is_super_admin() OR (is_company_admin() AND company_id = get_current_company_id())
  );

-- Tout le monde peut écrire des logs (via service_role en pratique)
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- TABLE: subscriptions
-- ============================================================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select" ON public.subscriptions
  FOR SELECT USING (
    is_super_admin() OR company_id = get_current_company_id()
  );

CREATE POLICY "subscriptions_write" ON public.subscriptions
  FOR ALL USING (is_super_admin());
