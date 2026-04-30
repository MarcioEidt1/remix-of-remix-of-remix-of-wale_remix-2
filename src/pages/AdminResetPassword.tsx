import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { KeyRound } from "lucide-react";
import prospectLogo from "@/assets/prospect-logo.png";
import PasswordInput from "@/components/admin/PasswordInput";

const AdminResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // The recovery link sets a session via the URL hash. Wait for it.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setValidSession(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValidSession(true);
      else setTimeout(() => setValidSession((v) => v ?? false), 1500);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("A senha deve ter ao menos 6 caracteres.");
    if (password !== confirmPassword) return setError("As senhas não coincidem.");

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) return setError(error.message);

    await supabase.auth.signOut();
    navigate("/admin/login?reset=success");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <img src={prospectLogo} alt="Prospect Car System" className="h-20 w-auto mb-3" />
          <h1 className="font-display font-bold text-xl text-foreground">Nova Senha</h1>
          <p className="text-muted-foreground text-sm mt-1">Defina uma nova senha de acesso</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded text-destructive text-sm">
            {error}
          </div>
        )}

        {validSession === false ? (
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded text-destructive text-sm text-center">
              Link inválido ou expirado. Solicite um novo link de recuperação.
            </div>
            <a
              href="/admin/forgot-password"
              className="block text-center text-sm text-primary hover:underline"
            >
              Solicitar novo link
            </a>
          </div>
        ) : validSession === null ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput
              placeholder="Nova senha (mín. 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <PasswordInput
              placeholder="Confirmar nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-primary font-display font-bold text-sm tracking-wider text-primary-foreground rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <KeyRound size={18} />
              {submitting ? "SALVANDO..." : "REDEFINIR SENHA"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminResetPassword;
