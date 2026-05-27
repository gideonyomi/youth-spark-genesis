import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Ctx = {
  user: User | null;
  session: Session | null;
  isStaff: boolean;
  isAdmin: boolean;
  pendingStatus: "pending" | "rejected" | "suspended" | "approved" | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({} as Ctx);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Ctx["pendingStatus"]>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async (uid: string | undefined) => {
    if (!uid) { setIsStaff(false); setIsAdmin(false); setPendingStatus(null); return; }
    const { data: rolesRows } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    const roles = (rolesRows ?? []).map((r) => r.role);
    setIsAdmin(roles.includes("admin"));
    setIsStaff(roles.includes("admin") || roles.includes("editor"));
    const { data: pending } = await supabase.from("pending_signups").select("status").eq("user_id", uid).maybeSingle();
    setPendingStatus((pending?.status as Ctx["pendingStatus"]) ?? null);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setTimeout(() => refresh(s?.user?.id), 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      refresh(data.session?.user?.id).finally(() => setLoading(false));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        user, session, isStaff, isAdmin, pendingStatus, loading,
        signIn: async (email, password) => {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          return { error: error?.message ?? null };
        },
        signUp: async (email, password, fullName) => {
          const { data, error } = await supabase.auth.signUp({
            email, password,
            options: {
              emailRedirectTo: `${window.location.origin}/admin`,
              data: fullName ? { full_name: fullName } : undefined,
            },
          });
          if (error) return { error: error.message };
          // Record a pending signup request (admins approve/reject from the dashboard).
          if (data.user) {
            await supabase.from("pending_signups").insert({
              user_id: data.user.id,
              email,
              full_name: fullName ?? null,
            } as any).select().maybeSingle();
          }
          return { error: null };
        },
        signOut: async () => { await supabase.auth.signOut(); },
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);
