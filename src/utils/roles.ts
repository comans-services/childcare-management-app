import type { Session } from '@supabase/supabase-js';

/** True when the user’s JWT has role=admin (case-insensitive). */
export const isAdmin = (user: Session['user'] | null | undefined): boolean =>
  (user?.user_metadata?.role ??
   user?.app_metadata?.role ??
   '')
    .toString()
    .toLowerCase() === 'admin';
