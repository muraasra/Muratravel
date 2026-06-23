import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

let _supabase: ReturnType<typeof getSupabase> = null;

export interface AuthContext {
  supabaseId: string;
  appUserId: number;
  companyId: number | null;
  role: string;
  name: string;
  email: string;
}

// Augment Express Request with our auth context
export type AuthedRequest = Request & { auth?: AuthContext; companyId?: number };

async function resolveAuth(req: Request): Promise<AuthContext | null> {
  const supabase = _supabase ?? (_supabase = getSupabase());
  if (!supabase) return null;

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  // Load (or lazily create) the application profile linked to this Supabase user.
  let [appUser] = await db.select().from(usersTable).where(eq(usersTable.supabaseId, user.id));
  if (!appUser) {
    const name = (user.user_metadata?.["full_name"] as string | undefined) ?? user.email?.split("@")[0] ?? "Utilisateur";
    const inserted = await db
      .insert(usersTable)
      .values({ supabaseId: user.id, name, email: user.email ?? "", role: "client" })
      .onConflictDoUpdate({ target: usersTable.email, set: { supabaseId: user.id } })
      .returning();
    appUser = inserted[0];
  }

  return {
    supabaseId: user.id,
    appUserId: appUser.id,
    companyId: appUser.companyId ?? null,
    role: appUser.role,
    name: appUser.name,
    email: appUser.email,
  };
}

/**
 * Requires a valid Supabase session. Attaches `req.auth`. Does NOT require the
 * user to belong to a company (used by /me and /onboarding).
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const supabase = _supabase ?? (_supabase = getSupabase());
  if (!supabase) {
    res.status(503).json({ error: "Auth service not configured" });
    return;
  }
  const auth = await resolveAuth(req);
  if (!auth) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }
  (req as AuthedRequest).auth = auth;
  next();
}

/**
 * Requires the authenticated user to belong to a company. Attaches
 * `req.companyId`. This is the tenant boundary: every data route mounted behind
 * this middleware is scoped to a single company.
 */
export function requireCompany(req: Request, res: Response, next: NextFunction): void {
  const auth = (req as AuthedRequest).auth;
  if (!auth) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (auth.companyId == null) {
    res.status(403).json({ error: "no_company", message: "Aucune compagnie associée à ce compte." });
    return;
  }
  (req as AuthedRequest).companyId = auth.companyId;
  next();
}

/** Returns the tenant company id for a request already passed through requireCompany. */
export function tenantCompanyId(req: Request): number {
  return (req as AuthedRequest).companyId as number;
}

/** Optional auth — attaches req.auth when a token is present, never rejects. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = await resolveAuth(req);
    if (auth) (req as AuthedRequest).auth = auth;
  } catch {
    /* ignore */
  }
  next();
}
