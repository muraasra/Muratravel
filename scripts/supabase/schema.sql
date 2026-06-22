-- ============================================================
-- MuraTravel — Schéma Supabase complet
-- RESET PROPRE : drop + recreate toutes les tables
-- À exécuter dans le SQL Editor de Supabase
-- ============================================================

-- 1. Drop toutes les tables existantes (dans l'ordre des dépendances)
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.notification_config CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.incidents CASCADE;
DROP TABLE IF EXISTS public.baggage CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.reservations CASCADE;
DROP TABLE IF EXISTS public.trips CASCADE;
DROP TABLE IF EXISTS public.vehicles CASCADE;
DROP TABLE IF EXISTS public.destinations CASCADE;
DROP TABLE IF EXISTS public.agencies CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- Drop les fonctions helper si elles existent
DROP FUNCTION IF EXISTS public.get_current_company_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_company_admin() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================
-- Extension UUID
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: companies
-- ============================================================
CREATE TABLE public.companies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  tax_number TEXT,
  country TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'XOF',
  language TEXT NOT NULL DEFAULT 'fr',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: users (lié à auth.users de Supabase)
-- NOTE: company_id est INTEGER simple, sans foreign key
--       pour éviter les conflits de type avec des schémas existants
-- ============================================================
CREATE TABLE public.users (
  id SERIAL PRIMARY KEY,
  supabase_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'client',
  -- Rôles: super_admin | company_admin | agency_manager | booking_agent
  --        boarding_agent | controller | accountant | driver | client
  company_id INTEGER,   -- Référence companies(id) sans FK stricte
  agency_id INTEGER,    -- Référence agencies(id) sans FK stricte
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: créer automatiquement un profil lors de l'inscription Supabase
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (supabase_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'client'
  )
  ON CONFLICT (email) DO UPDATE SET
    supabase_id = EXCLUDED.supabase_id,
    name = COALESCE(EXCLUDED.name, public.users.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TABLE: agencies
-- ============================================================
CREATE TABLE public.agencies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'SN',
  address TEXT,
  company_id INTEGER NOT NULL,
  manager_id INTEGER,
  phone TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: destinations
-- ============================================================
CREATE TABLE public.destinations (
  id SERIAL PRIMARY KEY,
  origin_city TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  distance_km INTEGER,
  duration_minutes INTEGER,
  base_price NUMERIC NOT NULL DEFAULT 0,
  company_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: vehicles
-- ============================================================
CREATE TABLE public.vehicles (
  id SERIAL PRIMARY KEY,
  license_plate TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'bus',
  brand TEXT,
  seats INTEGER NOT NULL DEFAULT 40,
  status TEXT NOT NULL DEFAULT 'available',
  insurance_expiry DATE,
  company_id INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: trips
-- ============================================================
CREATE TABLE public.trips (
  id SERIAL PRIMARY KEY,
  departure_date DATE NOT NULL,
  departure_time TEXT NOT NULL,
  arrival_date DATE,
  arrival_time TEXT,
  destination_id INTEGER NOT NULL,
  vehicle_id INTEGER NOT NULL,
  driver_id INTEGER,
  company_id INTEGER NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled',
  seats_available INTEGER NOT NULL DEFAULT 0,
  seats_total INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: reservations
-- ============================================================
CREATE TABLE public.reservations (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL,
  passenger_name TEXT NOT NULL,
  passenger_phone TEXT NOT NULL,
  passenger_email TEXT,
  passenger_id_number TEXT,
  seat_number TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'reserved',
  ticket_code TEXT NOT NULL UNIQUE,
  agency_id INTEGER,
  agent_id INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: baggage
-- ============================================================
CREATE TABLE public.baggage (
  id SERIAL PRIMARY KEY,
  reservation_id INTEGER NOT NULL,
  tracking_code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'standard',
  weight NUMERIC NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL DEFAULT 500,
  status TEXT NOT NULL DEFAULT 'registered',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: payments
-- ============================================================
CREATE TABLE public.payments (
  id SERIAL PRIMARY KEY,
  reservation_id INTEGER,
  amount NUMERIC NOT NULL DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'pending',
  company_id INTEGER NOT NULL,
  agency_id INTEGER,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: incidents
-- ============================================================
CREATE TABLE public.incidents (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'ouvert',
  priorite TEXT NOT NULL DEFAULT 'normale',
  rapporte_par TEXT NOT NULL,
  company_id INTEGER NOT NULL,
  trip_id INTEGER,
  reservation_id INTEGER,
  vehicle_id INTEGER,
  notes TEXT,
  date_resolution TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: transactions (journal de caisse)
-- ============================================================
CREATE TABLE public.transactions (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  montant NUMERIC NOT NULL,
  description TEXT NOT NULL,
  methode TEXT NOT NULL DEFAULT 'cash',
  reference TEXT NOT NULL,
  company_id INTEGER NOT NULL,
  agency_id INTEGER,
  reservation_id INTEGER,
  trip_id INTEGER,
  user_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE public.notifications (
  id SERIAL PRIMARY KEY,
  canal TEXT NOT NULL,
  declencheur TEXT NOT NULL,
  destinataire TEXT NOT NULL,
  message TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente',
  company_id INTEGER NOT NULL,
  reservation_id INTEGER,
  trip_id INTEGER,
  tentatives INTEGER NOT NULL DEFAULT 0,
  erreur TEXT,
  envoye_a TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.notification_config (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL UNIQUE,
  confirmation_sms BOOLEAN NOT NULL DEFAULT TRUE,
  confirmation_email BOOLEAN NOT NULL DEFAULT TRUE,
  confirmation_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
  modification_sms BOOLEAN NOT NULL DEFAULT TRUE,
  modification_email BOOLEAN NOT NULL DEFAULT TRUE,
  annulation_sms BOOLEAN NOT NULL DEFAULT TRUE,
  annulation_email BOOLEAN NOT NULL DEFAULT TRUE,
  rappel_sms BOOLEAN NOT NULL DEFAULT TRUE,
  rappel_whatsapp BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: audit_logs
-- ============================================================
CREATE TABLE public.audit_logs (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT NOT NULL,
  user_id TEXT,
  user_email TEXT,
  user_name TEXT,
  company_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  statut TEXT NOT NULL DEFAULT 'succes',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: subscriptions
-- ============================================================
CREATE TABLE public.subscriptions (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'starter',
  statut TEXT NOT NULL DEFAULT 'essai',
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  prix_mensuel NUMERIC NOT NULL DEFAULT 0,
  agences_max INTEGER NOT NULL DEFAULT 2,
  utilisateurs_max INTEGER NOT NULL DEFAULT 5,
  voyages_max INTEGER,
  stripe_subscription_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEX pour les performances
-- ============================================================
CREATE INDEX idx_reservations_trip_id ON public.reservations(trip_id);
CREATE INDEX idx_reservations_ticket_code ON public.reservations(ticket_code);
CREATE INDEX idx_trips_company_id ON public.trips(company_id);
CREATE INDEX idx_trips_departure_date ON public.trips(departure_date);
CREATE INDEX idx_baggage_reservation_id ON public.baggage(reservation_id);
CREATE INDEX idx_payments_company_id ON public.payments(company_id);
CREATE INDEX idx_incidents_company_id ON public.incidents(company_id);
CREATE INDEX idx_transactions_company_id ON public.transactions(company_id);
CREATE INDEX idx_notifications_company_id ON public.notifications(company_id);
CREATE INDEX idx_audit_logs_company_id ON public.audit_logs(company_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_users_supabase_id ON public.users(supabase_id);
CREATE INDEX idx_users_company_id ON public.users(company_id);
