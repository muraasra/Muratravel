// OPTION B (tout-en-un) — expose l'API Express comme fonction Netlify.
//
// Prérequis :
//   1. pnpm --filter @workspace/api-server add serverless-http
//   2. Dans netlify.toml, activez la redirection "OPTION B" (et commentez A).
//   3. Définissez dans l'UI Netlify les variables d'environnement du backend :
//        DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NODE_ENV=production
//
// Note : pour une API à fort trafic, préférez un hébergement Node dédié
// (Render/Railway/Fly) — voir OPTION A. Les fonctions serverless ouvrent une
// connexion Postgres par invocation : utilisez le « transaction pooler » Supabase
// (port 6543), prévu pour cet usage.

import serverless from "serverless-http";
import app from "../../artifacts/api-server/src/app";

export const handler = serverless(app, {
  basePath: "/.netlify/functions/api",
});
