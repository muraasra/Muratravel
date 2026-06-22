import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

let _supabase: ReturnType<typeof getSupabase> = null;

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const supabase = _supabase ?? (_supabase = getSupabase());
  if (!supabase) {
    res.status(503).json({ error: "Auth service not configured" });
    return;
  }
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }
  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  (req as Request & { supabaseUser: typeof user }).supabaseUser = user;
  next();
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const supabase = _supabase ?? (_supabase = getSupabase());
  if (!supabase) { next(); return; }
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      (req as Request & { supabaseUser: typeof user }).supabaseUser = user;
    }
  }
  next();
}
