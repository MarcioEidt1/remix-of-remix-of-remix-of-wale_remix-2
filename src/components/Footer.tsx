import { Link } from "react-router-dom";
import waleLogo from "@/assets/wale-logo.png";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import SocialIcon from "@/components/SocialIcon";
import { MapPin } from "lucide-react";

interface SocialNetwork {
  type: string;
  url: string;
}

const Footer = () => {
  const { data: settings } = useSiteSettings();

  let socialNetworks: SocialNetwork[] = [];
  try {
    socialNetworks = JSON.parse(settings?.social_networks || "[]").filter((s: SocialNetwork) => s.url);
  } catch {}

  const logoSrc = settings?.logo_url || waleLogo;
  const showLogo = settings?.show_logo !== "false";
  const companyName = settings?.company_name || "WALE AUTOMÓVEIS";
  const showCompanyName = settings?.show_company_name !== "false";
  const mapsEmbed = settings?.google_maps_embed || "";
  const address = settings?.address || "";
  const devLogoUrl = settings?.dev_logo_url || "";
  const devSiteUrl = settings?.dev_site_url || "";

  return (
    <footer className="border-t border-border bg-surface-elevated py-10">
      <div className="container">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Col 1: Brand + Social */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              {showLogo && <img src={logoSrc} alt={companyName} className="h-8 w-auto" />}
              {showCompanyName && (
                <span className="font-display font-bold tracking-wider text-foreground">
                  {companyName}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Qualidade e confiança em seminovos. Carros selecionados com garantia e as melhores condições do mercado.
            </p>

            {/* Social Networks */}
            {socialNetworks.length > 0 && (
              <div>
                <h4 className="font-display font-bold text-foreground text-sm mb-3">Redes Sociais</h4>
                <div className="flex gap-3">
                  {socialNetworks.map((net, i) => (
                    <a
                      key={i}
                      href={net.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-card border border-border rounded-sm text-muted-foreground hover:text-primary hover:border-primary transition-all"
                    >
                      <SocialIcon type={net.type} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Col 2: Links + Address */}
          <div>
            <h4 className="font-display font-bold text-foreground mb-4">Links</h4>
            <nav className="flex flex-col gap-2 mb-6">
              <a href="#home" className="text-muted-foreground text-sm hover:text-primary transition-colors">Home</a>
              <a href="#veiculos" className="text-muted-foreground text-sm hover:text-primary transition-colors">Veículos</a>
              <a href="#sobre" className="text-muted-foreground text-sm hover:text-primary transition-colors">A Wale</a>
              <a href="#contato" className="text-muted-foreground text-sm hover:text-primary transition-colors">Contato</a>
              <Link to="/politica-de-privacidade" className="text-muted-foreground text-sm hover:text-primary transition-colors">Política de Privacidade</Link>
            </nav>

            {address && (
              <div>
                <h4 className="font-display font-bold text-foreground text-sm mb-2 flex items-center gap-1.5">
                  <MapPin size={14} />
                  Endereço
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{address}</p>
              </div>
            )}
          </div>

          {/* Col 3: Google Maps */}
          <div>
            <h4 className="font-display font-bold text-foreground mb-4">Localização</h4>
            {mapsEmbed ? (
              <iframe
                src={mapsEmbed}
                width="100%"
                height="220"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-lg"
              />
            ) : (
              <div className="bg-card border border-border rounded-lg h-[220px] flex items-center justify-center">
                <p className="text-muted-foreground text-sm text-center px-4">
                  Mapa não configurado.<br />
                  <span className="text-xs">Configure na área administrativa.</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} {companyName}. Todos os direitos reservados.
          </p>
          {devLogoUrl && (
            <a
              href={devSiteUrl || "#"}
              target="_blank"
              rel="noreferrer"
              className="opacity-60 hover:opacity-100 transition-opacity"
              title="Desenvolvido por"
            >
              <img src={devLogoUrl} alt="Desenvolvedor" className="h-6 w-auto" />
            </a>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
