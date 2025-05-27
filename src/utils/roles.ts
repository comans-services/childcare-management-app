
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

let cachedAdminIds = new Set<string>();       // memoise per session

/**
 * True when the user is an admin.
 * Priority:
 *   1) role claim in JWT
 *   2) role column in public.profiles (cached)
 */
export const isAdmin = async (user: Session["user"] | null | undefined): Promise<boolean> => {
  if (!user) return false;

  /* ---------- 1 · JWT claim (fast) ---------- */
  const jwtRole =
    (user.user_metadata?.role ??
      user.app_metadata?.role ??
      "") as string;
  if (jwtRole.toLowerCase() === "admin") return true;

  /* ---------- 2 · Cached DB lookup ---------- */
  if (cachedAdminIds.has(user.id)) return true;

  /* ---------- 3 · DB lookup (async) ---------- */
  try {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (data?.role?.toLowerCase?.() === "admin") {
      cachedAdminIds.add(user.id);
      return true;
    }
  } catch {
    // ignore errors - default to false
  }

  return false;
};
