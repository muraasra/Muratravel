import { supabase } from "./supabase";

/**
 * Thin wrapper around fetch that attaches the Supabase JWT and talks to the
 * Express API (proxied at /api in dev, same-origin in production via Netlify).
 */
export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string>) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (init?.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

  const res = await fetch(path, { ...init, headers });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
    } catch { /* ignore */ }
    const err = new Error(message) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export interface MeResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  companyId: number | null;
  company: { id: number; name: string; currency: string; country: string } | null;
  onboarded: boolean;
}
