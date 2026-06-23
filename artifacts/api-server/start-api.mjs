// Charge le .env racine et démarre le serveur Express sur le port 3000
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", "..", ".env");

try {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
  console.log(`[start-api] Loaded env from ${envPath}`);
} catch (e) {
  console.warn(`[start-api] Could not read ${envPath}: ${e.message}`);
}

process.env.PORT = process.env.API_PORT || "3000";
process.env.NODE_ENV = process.env.NODE_ENV || "development";

await import("./dist/index.mjs");
