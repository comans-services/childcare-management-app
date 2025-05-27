import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

let cachedAdminIds = new Set<string>();       // memoise per session

/**
 * True when the user is an admin.
 * Priority:
 *   1) role claim in JWT
 *   2) role column in public.profiles
 */
export const isAdmin = (user: Session["user"] | null | undefined): boolean => {
  if (!user) return false;

  /* ---------- 1 · JWT claim (fast) ---------- */
  const jwtRole =
    (user.user_metadata?.role ??
      user.app_metadata?.role ??
      "") as string;
  if (jwtRole.toLowerCase() === "admin") return true;

  /* ---------- 2 · Cached DB lookup ---------- */
  if (cachedAdminIds.has(user.id)) return true;

  /* ---------- 3 · DB lookup (sync wrapper around async) ---------- */
  // NOTE: Supabase JS is async; but our caller expects a sync boolean.
  // We'll kick off an async fetch and cache the result for next call.
  // Until it resolves, return false (employee scope) once; the second
  // click will hit the cache and behave as admin.

  void supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
    .then(({ data }) => {
      if (data?.role?.toLowerCase?.() === "admin") {
        cachedAdminIds.add(user.id);
      }
    })
    .catch(() => {/* ignore errors */});

  return false;
};