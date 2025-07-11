
import { Session, User } from "@supabase/supabase-js";

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: "employee" | "manager" | "admin" | null;
  employmentType: "full-time" | "part-time" | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  loading: boolean;
}
