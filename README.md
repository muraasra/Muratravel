# MuraTravel — Plateforme SaaS de gestion du transport de voyageurs

SaaS **multi-compagnies** pour les transporteurs de voyageurs (bus, minibus, ferry) en
Afrique de l'Ouest. Chaque compagnie dispose d'un espace **totalement isolé** :
billetterie avec QR Code, embarquement, flotte, caisse, rapports temps réel,
authentification Supabase + 2FA — le tout **responsive** (mobile, tablette, desktop).

---

## Table des matières
1. [Aperçu](#aperçu)
2. [Stack technique](#stack-technique)
3. [Architecture du monorepo](#architecture-du-monorepo)
4. [Confidentialité & isolation des compagnies](#confidentialité--isolation-des-compagnies)
5. [Parcours d'un nouveau client (super-admin)](#parcours-dun-nouveau-client-super-admin)
6. [Lancer le projet en local](#lancer-le-projet-en-local)
7. [Déploiement sur Netlify](#déploiement-sur-netlify)
8. [Modules](#modules)

---

## Aperçu

- **Site vitrine** public (`/`) qui présente le produit et incite à l'inscription.
- **Inscription en autonomie** : un dirigeant crée son compte, crée **sa compagnie**,
  en devient l'**administrateur** et commence immédiatement à gérer.
- **Cloisonnement strict** : une compagnie ne voit jamais les données d'une autre.
- **Mobile-first** : barre latérale repliable en tiroir, mise en page adaptative.

---

## Stack technique

| Couche | Technologies |
|--------|-------------|
| Frontend | React 18 + Vite 7 + TypeScript + Tailwind CSS v4 + shadcn/ui |
| Routing | Wouter · Data fetching : TanStack Query |
| Backend | Express 5 + TypeScript + Drizzle ORM |
| Base de données | PostgreSQL (Supabase) via le *transaction pooler* |
| Auth | Supabase Auth — Google OAuth + Email/Mot de passe + 2FA TOTP |
| Validation | Zod v4 (schémas partagés `@workspace/api-zod`) |
| Monorepo | pnpm workspaces |
| Couleur de marque | Teal/Émeraude (`--primary: 175 84% 32%`) |

---

## Architecture du monorepo

```
Muratravel/
├── artifacts/
│   ├── transport-saas/      # App React (frontend)  → @workspace/transport-saas
│   │   └── src/
│   │       ├── pages/landing.tsx      # site vitrine
│   │       ├── pages/signup.tsx       # inscription
│   │       ├── pages/onboarding.tsx   # création de la compagnie
│   │       ├── lib/api.ts             # apiFetch (JWT + /api)
│   │       └── hooks/useMe.ts         # profil + contexte compagnie
│   └── api-server/          # API Express (backend)  → @workspace/api-server
│       ├── src/middlewares/auth.ts    # requireAuth + requireCompany (tenant)
│       ├── src/routes/me.ts           # /api/me + /api/onboarding
│       └── start-api.mjs              # démarrage local (charge le .env racine)
├── lib/
│   ├── db/                  # Schémas Drizzle + connexion (DATABASE_URL)
│   ├── api-zod/             # Schémas Zod partagés
│   └── api-client-react/    # Client API généré (hooks TanStack Query)
├── netlify.toml             # déploiement Netlify
└── netlify/functions/api.ts # API en fonction serverless (option B)
```

---

## Confidentialité & isolation des compagnies

L'isolation est **imposée côté serveur, sur chaque requête** — pas seulement masquée dans l'UI.

1. **`requireAuth`** valide le JWT Supabase puis charge le profil applicatif
   (`public.users`) pour en déduire `companyId` et `role`.
2. **`requireCompany`** refuse (403) tout accès aux données sans compagnie associée.
3. **Toutes les routes** filtrent par `companyId` : les lectures sont scopées
   (`WHERE company_id = …`), les écritures forcent le `companyId` du tenant
   (un client ne peut pas créer de données pour une autre compagnie même en
   falsifiant le champ).
4. Les tables enfants (`reservations`, `baggage`, `payments`) portent une colonne
   `company_id` dénormalisée pour un filtrage uniforme et sûr.
5. Un accès croisé à une ressource d'une autre compagnie renvoie **404**.

> Vérifié : deux compagnies créées en parallèle ne voient chacune que leurs propres
> véhicules/voyages ; l'accès par identifiant à la ressource d'autrui est refusé.

Sécurité complémentaire : Supabase Auth, **2FA TOTP**, rôles
(`company_admin`, `agency_manager`, `booking_agent`, `boarding_agent`, `controller`,
`accountant`, `driver`, `client`) et journal d'audit.

---

## Parcours d'un nouveau client (super-admin)

```
Site vitrine (/)
   └─ « Créer ma compagnie »  →  /signup  (email + mot de passe, ou Google)
        └─ Connexion  →  écran d'onboarding (« Créons votre compagnie »)
             └─ POST /api/onboarding  ⇒  crée la compagnie + passe l'utilisateur
                en role=company_admin + ouvre un essai gratuit de 14 j
                  └─ Tableau de bord de SA compagnie (données vides au départ)
```

Aucune intervention manuelle : le dirigeant est autonome de bout en bout.

---

## Réservation publique (sans compte)

Chaque compagnie reçoit un **lien public unique** (`/book/<slug>`) qu'elle partage par
SMS / WhatsApp / réseaux ou via un **QR Code** affiché en agence. N'importe qui peut alors
réserver **sans se connecter** :

```
Lien public  /book/<slug>   (slug généré à la création de la compagnie)
   └─ GET  /api/public/company/:slug          → infos compagnie + config du formulaire
   └─ GET  /api/public/company/:slug/trips     → voyages réservables (à venir, places dispo)
   └─ POST /api/public/company/:slug/reservations → crée la réservation (statut « réservé »,
        prix fixé côté serveur, billet TKT-XXXX + QR Code de confirmation)
```

Ces routes sont **publiques** (hors barrière tenant) mais résolvent la compagnie via le slug
et restent **cloisonnées** : la réservation n'apparaît que dans l'espace de cette compagnie.

**La compagnie personnalise son formulaire** depuis *Opérations → Réservation en ligne* :
- activer/désactiver la réservation en ligne, copier le lien, afficher/régénérer le QR Code ;
- message d'accueil ; pour chaque champ (email, pièce d'identité, siège) : **Masqué /
  Optionnel / Obligatoire**. « Nom » et « Téléphone » sont toujours requis.

Les exigences de champs sont **validées côté serveur** (`GET/PUT /api/booking-config`,
tenant-scopé), pas seulement dans l'UI : une réservation à laquelle manque un champ
obligatoire est rejetée (400).

---

## Lancer le projet en local

### Prérequis
- Node.js ≥ 20, pnpm ≥ 10, un projet Supabase.

### 1) Variables d'environnement — `.env` à la racine
```env
# Backend (API Express)
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # clé service_role (backend uniquement)
SUPABASE_ANON_KEY=eyJ...
```
> `DATABASE_URL` utilise le **pooler** Supabase (l'hôte direct `db.<ref>.supabase.co`
> n'est résolu qu'en IPv6). Récupérez l'URL exacte dans
> *Supabase → Project Settings → Database → Connection string → Transaction pooler*.

### 2) Variables du frontend — `artifacts/transport-saas/.env`
```env
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
PORT=5173
BASE_PATH=/
```

### 3) Base de données (Supabase)
Le schéma est défini en Drizzle (`lib/db/src/schema`). Pour l'appliquer :
```bash
cd lib/db
# DATABASE_URL doit pointer sur le SESSION pooler (port 5432) pour les migrations
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres" \
  pnpm exec drizzle-kit push
```
Activez aussi le trigger d'auto-profil (création d'une ligne `public.users` à
l'inscription) et, dans Supabase → Authentication → Providers, le provider **Google**
avec `http://localhost:5173` en Redirect URL.

### 4) Démarrer le backend (port 3000)
```bash
cd artifacts/api-server
pnpm run build           # bundle esbuild → dist/index.mjs
node start-api.mjs       # charge le .env racine et écoute sur :3000
```

### 5) Démarrer le frontend (port 5173)
```bash
# Windows PowerShell
$env:PORT="5173"; $env:BASE_PATH="/"
cd artifacts/transport-saas
pnpm exec vite --host 0.0.0.0
```
Le dev-server **proxifie `/api/*` vers `http://localhost:3000`** (voir `vite.config.ts`).
Ouvrez **http://localhost:5173**.

> Windows : si Vite échoue sur un binaire natif, installez le variant Windows :
> `pnpm add @rollup/rollup-win32-x64-msvc lightningcss-win32-x64-msvc @tailwindcss/oxide-win32-x64-msvc -w --ignore-scripts`

---

## Déploiement sur Netlify

Le frontend (statique) est hébergé par Netlify ; l'API Express est servie soit par un
hébergeur Node, soit par une fonction Netlify. La configuration est dans
[`netlify.toml`](netlify.toml).

### Étapes
1. **Connectez le dépôt** à Netlify (build auto via `netlify.toml`).
2. **Variables d'environnement** (Site settings → Environment) :
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (frontend)
3. **Choisissez le mode API** :

   **Option A — backend séparé (recommandé)**
   Déployez `artifacts/api-server` sur Render / Railway / Fly (commande
   `pnpm run build && node dist/index.mjs`, variables `DATABASE_URL`,
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT`, `NODE_ENV=production`).
   Puis dans `netlify.toml`, remplacez l'URL de la redirection `/api/*` par celle
   de votre backend.

   **Option B — tout sur Netlify (fonction serverless)**
   ```bash
   pnpm --filter @workspace/api-server add serverless-http
   ```
   Activez la redirection « OPTION B » dans `netlify.toml`, et ajoutez les variables
   backend (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `NODE_ENV=production`) côté Netlify. La fonction est dans
   [`netlify/functions/api.ts`](netlify/functions/api.ts).

4. **Supabase** : ajoutez l'URL Netlify (`https://votre-site.netlify.app`) dans les
   *Redirect URLs* du provider Google.

La build de production a été validée : `vite build` produit `dist/public/` sans erreur.

---

## Modules

**Opérations** : Tableau de bord · Voyages · Réservations (QR + impression 80mm) ·
**Réservation en ligne** (lien public + formulaire personnalisable) · Embarquement · Bagages · Paiements
**Réseau & flotte** : Compagnies · Agences · Véhicules · Destinations
**Administration** : Utilisateurs & rôles · Journal de caisse · Rapports · Incidents ·
Notifications · Abonnements · Audit & logs · Mon compte (profil, mot de passe, **2FA**)

---

## Billets

QR Code réel (JSON : code, passager, siège, itinéraire, date) · impression thermique
80mm · code unique `TKT-XXXXXX` · coupon de contrôle détachable.

---

*MuraTravel — Simplifier le transport en Afrique de l'Ouest.*
