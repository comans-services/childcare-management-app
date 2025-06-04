
import { Session, User } from "@supabase/supabase-js";

export interface AuthContextProps {
  session: Session | null;
  user: User | null;
  userRole: "employee" | "admin" | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  loading: boolean;
}
