import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ArrowLeft } from "lucide-react";
import prospectLogo from "@/assets/prospect-logo.png";

const AdminForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // Resolve login -> recovery email via rate-limited edge function
    const { data: resolved } = await supabase.functions.invoke("resolve-login", {
      body: { login: email.trim(), mode: "recovery" },
    });
    const recoveryEmail = (resolved as { email?: string } | null)?.email;

    const target = recoveryEmail || email.trim();

    if (!target.includes("@") || target.endsWith("@prospect.system")) {
      setSubmitting(false);
      setError(
        "Este usuário não tem e-mail de recuperação cadastrado. Solicite ao administrador Master para cadastrar um e-mail."
      );
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(target, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      setError("Não foi possível enviar o e-mail. Tente novamente.");
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <img src={prospectLogo} alt="Prospect Car System" className="h-20 w-auto mb-3" />
          <h1 className="font-display font-bold text-xl text-foreground">Recuperar Senha</h1>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            Informe seu e-mail para receber o link
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded text-destructive text-sm">
            {error}
          </div>
        )}

        {sent ? (
          <div className="space-y-4">
            <div className="p-4 bg-primary/10 border border-primary/30 rounded text-foreground text-sm text-center">
              ✅ Se o e-mail existir, enviamos um link para redefinir a senha.
              Verifique sua caixa de entrada (e o spam).
            </div>
            <Link
              to="/admin/login"
              className="block text-center text-sm text-primary hover:underline"
            >
              ← Voltar ao login
            </Link>
          </div>
        ) : (
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
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-primary font-display font-bold text-sm tracking-wider text-primary-foreground rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Mail size={18} />
              {submitting ? "ENVIANDO..." : "ENVIAR LINK"}
            </button>

            <Link
              to="/admin/login"
              className="flex items-center justify-center gap-2 text-muted-foreground text-sm hover:text-primary transition-colors"
            >
              <ArrowLeft size={14} />
              Voltar ao login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminForgotPassword;
