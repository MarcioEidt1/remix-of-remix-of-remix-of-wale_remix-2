import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isMaster: boolean;
  permissions: string[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMaster, setIsMaster] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const checkAdmin = async (userId: string) => {
    try {
      const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      setIsAdmin(!!data);

      if (data) {
        // Fetch role details (is_master and permissions are dynamic columns)
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", userId)
          .eq("role", "admin")
          .single();

        const rd = roleData as any;
        setIsMaster(rd?.is_master ?? false);
        setPermissions((rd?.permissions as string[]) ?? []);
      } else {
        setIsMaster(false);
        setPermissions([]);
      }
    } catch {
      setIsAdmin(false);
      setIsMaster(false);
      setPermissions([]);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkAdmin(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => {
          checkAdmin(session.user.id).then(() => setLoading(false));
        }, 0);
      } else {
        setIsAdmin(false);
        setIsMaster(false);
        setPermissions([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut({ scope: "global" });
    setIsAdmin(false);
    setIsMaster(false);
    setPermissions([]);
  };

  const hasPermission = (permission: string) => {
    if (isMaster) return true;
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isMaster, permissions, loading, signIn, signOut, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
