import { useState, useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const LGPD_KEY = "lgpd_consent_accepted";

const LgpdBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(LGPD_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(LGPD_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-card border-t border-border shadow-lg p-4 md:p-6 animate-fade-in">
      <div className="container flex flex-col md:flex-row items-start md:items-center gap-4">
        <ShieldCheck className="text-primary flex-shrink-0 mt-0.5" size={28} />
        <div className="flex-1">
          <p className="text-sm text-foreground font-medium mb-1">
            Aviso de Privacidade (LGPD)
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Este site coleta dados pessoais como nome, e-mail, telefone e mensagem quando você
            entra em contato conosco, exclusivamente para fins de atendimento comercial.
            Ao continuar navegando, você concorda com nossa{" "}
            <Link to="/politica-de-privacidade" className="text-primary underline hover:opacity-80">
              Política de Privacidade
            </Link>.
          </p>
        </div>
        <button
          onClick={accept}
          className="px-6 py-2 bg-gradient-primary text-primary-foreground font-display font-bold text-sm rounded-sm hover:opacity-90 transition-opacity flex-shrink-0"
        >
          ACEITAR
        </button>
      </div>
    </div>
  );
};

export default LgpdBanner;
