import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LogIn } from "lucide-react";
import prospectLogo from "@/assets/prospect-logo.png";
import PasswordInput from "@/components/admin/PasswordInput";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();

  // Redirect when auth context confirms admin
  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate("/admin");
    }
  }, [loading, user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const input = email.trim();
    let loginEmail = input;

    // Legacy hardcoded master alias
    if (input.toLowerCase() === "prospectsystem") {
      loginEmail = "prospectsystem@prospect.system";
    } else {
      // Resolve username/recovery-email -> auth email via rate-limited edge function
      const { data: resolved } = await supabase.functions.invoke("resolve-login", {
        body: { login: input },
      });
      const email = (resolved as { email?: string } | null)?.email;
      if (email) loginEmail = email;
    }

    const { error } = await signIn(loginEmail, password);
    if (error) {
      setError("Login ou senha inválidos.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <img src={prospectLogo} alt="Prospect Car System" className="h-20 w-auto mb-3" />
          <h1 className="font-display font-bold text-xl text-foreground">Painel Administrativo</h1>
          <p className="text-muted-foreground text-sm mt-1">Faça login para continuar</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Usuário ou e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            className="w-full px-4 py-3 bg-secondary text-foreground border border-border rounded-sm font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          <PasswordInput
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-primary font-display font-bold text-sm tracking-wider text-primary-foreground rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <LogIn size={18} />
            {submitting ? "ENTRANDO..." : "ENTRAR"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <a href="/admin/forgot-password" className="text-primary text-xs hover:underline transition-colors">
            Esqueci minha senha
          </a>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-muted-foreground text-xs hover:text-primary transition-colors">
            ← Voltar ao site
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
