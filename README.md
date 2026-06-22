# MuraTravel — Plateforme SaaS de Gestion Transport

Système complet de gestion pour compagnies de transport de voyageurs (bus, minibus, ferry). Multi-tenant, multi-agences, avec authentification Supabase, QR Code sur les billets et tableau de bord en temps réel.

---

## Stack technique

| Couche | Technologies |
|--------|-------------|
| Frontend | React 18 + Vite 7 + TypeScript + Tailwind CSS v4 + shadcn/ui |
| Backend | Express 5 + TypeScript + Drizzle ORM |
| Base de données | PostgreSQL via Supabase (RLS multi-tenant) |
| Auth | Supabase Auth — Google OAuth + Email/Password + 2FA TOTP |
| Monorepo | pnpm workspaces |
| Routing | Wouter |
| Data fetching | TanStack Query |
| Validation | Zod v4 |

---

## Architecture monorepo

```
Muratravel/
├── artifacts/
│   ├── transport-saas/      # Application React (frontend)
│   └── api-server/          # Serveur Express (backend)
├── lib/
│   ├── db/                  # Schémas Drizzle ORM
│   ├── api-zod/             # Schémas de validation Zod
│   └── api-client-react/    # Client API généré (hooks TanStack Query)
└── scripts/
    └── supabase/
        ├── schema.sql       # Création des tables + trigger auto-profil
        └── rls-policies.sql # Politiques RLS multi-tenant
```

---

## Prérequis

- Node.js >= 20
- pnpm >= 10
- Compte Supabase (projet existant)

---

## Installation

### 1. Installer les dépendances

```bash
# Sur Windows, certains binaires natifs doivent être installés séparément
# car le preinstall script est Unix-only
pnpm add @rollup/rollup-win32-x64-msvc lightningcss-win32-x64-msvc @tailwindcss/oxide-win32-x64-msvc -w --ignore-scripts
```

### 2. Variables d'environnement

**Racine du projet** — `.env` :
```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
PASSWORD=<mot_de_passe_db>
```

**Frontend** — `artifacts/transport-saas/.env` :
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
PORT=5173
BASE_PATH=/
```

### 3. Base de données Supabase

Dans le **SQL Editor** de Supabase, exécuter dans l'ordre :

```sql
-- 1. Créer toutes les tables + trigger auto-profil Google
scripts/supabase/schema.sql

-- 2. Activer le Row Level Security multi-tenant
scripts/supabase/rls-policies.sql
```

### 4. Activer Google OAuth dans Supabase

1. Dashboard Supabase → **Authentication** → **Providers**
2. Activer **Google**
3. Ajouter `http://localhost:5173` dans les **Redirect URLs**
4. Coller les Client ID et Client Secret Google

---

## Démarrage

### Frontend (React + Vite)

```bash
# Windows PowerShell
$env:PORT="5173"; $env:BASE_PATH="/"
cd artifacts/transport-saas
pnpm exec vite --config vite.config.ts --host 0.0.0.0
```

Ouvrir **http://localhost:5173**

### Backend API (Express)

```bash
cd artifacts/api-server
$env:PORT="3000"
pnpm run dev
```

---

## Modules (15 au total)

### Opérations
| Module | Route | Description |
|--------|-------|-------------|
| Tableau de bord | `/` | KPIs temps réel, revenus, occupation |
| Voyages | `/trips` | Planification, statuts, manifeste |
| Réservations | `/reservations` | Création billet, QR Code, impression |
| Embarquement | `/boarding` | Contrôle passagers, scan billet |
| Bagages | `/baggage` | Suivi code-barres, flux de statut |
| Paiements | `/payments` | Encaissements, historique |

### Réseau & Flotte
| Module | Route | Description |
|--------|-------|-------------|
| Compagnies | `/companies` | Gestion multi-compagnie |
| Agences | `/agencies` | Réseau d'agences par ville |
| Véhicules | `/vehicles` | Parc auto, dates assurance |
| Destinations | `/destinations` | Routes, distances, tarifs |

### Administration
| Module | Route | Description |
|--------|-------|-------------|
| Utilisateurs | `/users` | 9 rôles distincts |
| Journal de caisse | `/finance` | Encaissements, dépenses, solde |
| Incidents | `/incidents` | Réclamations, bagages perdus, retards |
| Notifications | `/notifications` | SMS/Email/WhatsApp automatiques |
| Abonnements | `/subscriptions` | Plans Starter/Business/Enterprise |
| Audit & Logs | `/audit` | Historique complet des actions |
| Rapports | `/reports` | Revenus, occupation, top destinations |
| Mon compte | `/profile` | Profil, mot de passe, 2FA |

---

## Authentification

### Modes de connexion
- **Google OAuth** — un clic, redirection Supabase
- **Email + mot de passe** — formulaire classique

### 2FA (TOTP)
1. Aller dans **Mon compte → onglet 2FA**
2. Cliquer **Activer l'authentification à 2 facteurs**
3. Scanner le QR Code avec Google Authenticator, Authy ou Microsoft Authenticator
4. Entrer le code à 6 chiffres pour valider

### Rôles utilisateurs
| Rôle | Accès |
|------|-------|
| `super_admin` | Toutes les compagnies |
| `company_admin` | Gestion complète d'une compagnie |
| `agency_manager` | Gestion d'une agence |
| `booking_agent` | Réservations |
| `boarding_agent` | Embarquement |
| `controller` | Contrôle et vérification |
| `accountant` | Finances et rapports |
| `driver` | Informations voyage |
| `client` | Consultation |

---

## Billets de voyage

Chaque billet inclut :
- **QR Code réel** (encodage JSON : code, passager, siège, itinéraire, date)
- **Bouton Impression** → fenêtre 80mm (compatible imprimante thermique)
- Code unique `TKT-XXXXXX`
- Coupon de contrôle détachable

---

## Sécurité

| Mécanisme | Description |
|-----------|-------------|
| RLS Supabase | Isolation totale des données par `company_id` |
| JWT vérifié | `SUPABASE_SERVICE_ROLE_KEY` valide chaque token côté serveur |
| Token auto | `setAuthTokenGetter` attache le JWT à chaque requête API |
| 2FA TOTP | `supabase.auth.mfa.*` — standard RFC 6238 |
| Trigger PG | Profil créé automatiquement lors de l'inscription Google |

---

## Roadmap

- [ ] Intégration Stripe — paiement des abonnements
- [ ] SMS/WhatsApp réels via Twilio
- [ ] Export PDF des rapports
- [ ] Application mobile conducteur (React Native)
- [ ] Scan QR Code caméra pour l'embarquement en temps réel

---

*MuraTravel — Simplifier la gestion du transport en Afrique de l'Ouest*
