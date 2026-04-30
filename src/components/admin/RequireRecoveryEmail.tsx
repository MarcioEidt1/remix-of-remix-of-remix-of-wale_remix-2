import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Mail } from "lucide-react";
import { toast } from "sonner";

interface Props {
  children: React.ReactNode;
}

const RequireRecoveryEmail = ({ children }: Props) => {
  const { user, isAdmin, loading } = useAuth();
  const [checked, setChecked] = useState(false);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading || !user || !isAdmin) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("recovery_email, username")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const email = data?.recovery_email || "";
      setRecoveryEmail(email);
      setUsername(data?.username || "");
      setNeedsEmail(!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email));
      setChecked(true);
    })();
    return () => { cancelled = true; };
  }, [user, isAdmin, loading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recoveryEmail)) {
      toast.error("E-mail inválido");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("user_profiles").upsert(
      { user_id: user.id, recovery_email: recoveryEmail, username: username || null },
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    toast.success("E-mail de recuperação salvo!");
    setNeedsEmail(false);
  };

  if (loading || !user || !isAdmin) return <>{children}</>;
  if (!checked) return null;

  if (needsEmail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-lg p-8">
          <div className="flex flex-col items-center mb-6">
            <Mail size={40} className="text-primary mb-3" />
            <h1 className="font-display font-bold text-xl text-foreground text-center">
              Cadastre um e-mail de recuperação
            </h1>
            <p className="text-muted-foreground text-sm mt-2 text-center">
              Para garantir que você possa recuperar o acesso caso esqueça a senha,
              precisamos do seu e-mail real.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <input
              type="email"
              placeholder="seu@email.com"
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-3 bg-secondary text-foreground border border-border rounded-sm text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-gradient-primary font-display font-bold text-sm tracking-wider text-primary-foreground rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "SALVANDO..." : "SALVAR E CONTINUAR"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireRecoveryEmail;
