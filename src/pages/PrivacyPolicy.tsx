import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { ShieldCheck } from "lucide-react";

const PrivacyPolicy = () => {
  const { data: settings } = useSiteSettings();
  const companyName = settings?.company_name || "WALE AUTOMÓVEIS";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-16 md:py-24 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck className="text-primary" size={32} />
          <h1 className="font-display font-black text-2xl md:text-4xl text-foreground">
            Política de Privacidade
          </h1>
        </div>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
          <p className="text-foreground font-medium">
            A {companyName} respeita a sua privacidade e está comprometida com a proteção dos seus
            dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD).
          </p>

          <section>
            <h2 className="font-display font-bold text-foreground text-lg mt-8 mb-3">
              1. Dados coletados
            </h2>
            <p>Coletamos os seguintes dados pessoais quando você entra em contato conosco:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Formulário de contato do site:</strong> nome, e-mail, telefone e mensagem.</li>
              <li><strong>WhatsApp:</strong> número de celular e conteúdo da mensagem enviada.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-foreground text-lg mt-8 mb-3">
              2. Finalidade do tratamento
            </h2>
            <p>Os dados coletados são utilizados exclusivamente para:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Responder às suas solicitações e dúvidas.</li>
              <li>Fornecer informações sobre veículos e condições comerciais.</li>
              <li>Entrar em contato para acompanhamento comercial.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-foreground text-lg mt-8 mb-3">
              3. Armazenamento dos dados
            </h2>
            <p>
              Os dados são armazenados em servidores seguros com criptografia e acesso restrito,
              pelo tempo necessário para cumprir as finalidades para as quais foram coletados ou
              conforme exigido por lei.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-foreground text-lg mt-8 mb-3">
              4. Compartilhamento de dados
            </h2>
            <p>
              Não compartilhamos, vendemos ou alugamos seus dados pessoais a terceiros. Os dados
              podem ser compartilhados apenas quando exigido por lei ou ordem judicial.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-foreground text-lg mt-8 mb-3">
              5. Seus direitos
            </h2>
            <p>De acordo com a LGPD, você tem direito a:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Solicitar acesso aos seus dados pessoais.</li>
              <li>Corrigir dados incompletos ou desatualizados.</li>
              <li>Solicitar a exclusão dos seus dados.</li>
              <li>Revogar o consentimento a qualquer momento.</li>
            </ul>
            <p className="mt-2">
              Para exercer seus direitos, entre em contato conosco através do formulário do site
              ou pelo WhatsApp.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-foreground text-lg mt-8 mb-3">
              6. Cookies e dados de navegação
            </h2>
            <p>
              Este site utiliza armazenamento local (localStorage) apenas para registrar sua
              preferência de consentimento LGPD. Não utilizamos cookies de rastreamento de terceiros.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-foreground text-lg mt-8 mb-3">
              7. Alterações nesta política
            </h2>
            <p>
              Esta política pode ser atualizada periodicamente. Recomendamos que você a consulte
              regularmente.
            </p>
          </section>

          <p className="text-xs text-muted-foreground mt-10 border-t border-border pt-4">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
