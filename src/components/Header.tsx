import { useState, useCallback } from "react";
import { Menu, X, Search, Home, Car, Building2, MessageSquareQuote, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import waleLogo from "@/assets/wale-logo.png";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import SocialIcon from "@/components/SocialIcon";

interface MenuItem {
  label: string;
  href: string;
}

interface SocialNetwork {
  type: string;
  url: string;
}

const defaultNavItems: MenuItem[] = [
  { label: "HOME", href: "#home" },
  { label: "VEÍCULOS", href: "#veiculos" },
  { label: "A WALE", href: "#sobre" },
  { label: "DEPOIMENTOS", href: "#depoimentos" },
  { label: "CONTATO", href: "#contato" },
];

const iconMap: Record<string, React.ReactNode> = {
  HOME: <Home size={16} />,
  VEÍCULOS: <Car size={16} />,
  "A WALE": <Building2 size={16} />,
  DEPOIMENTOS: <MessageSquareQuote size={16} />,
  CONTATO: <Phone size={16} />,
};

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: settings } = useSiteSettings();
  const location = useLocation();
  const navigate = useNavigate();

  let navItems = defaultNavItems;
  try {
    const parsed = JSON.parse(settings?.menu_items || "[]");
    if (parsed.length) navItems = parsed;
  } catch {}

  let socialNetworks: SocialNetwork[] = [];
  try {
    socialNetworks = JSON.parse(settings?.social_networks || "[]").filter((s: SocialNetwork) => s.url);
  } catch {}

  const logoSrc = settings?.logo_url || waleLogo;
  const showLogo = settings?.show_logo !== "false";
  const companyName = settings?.company_name || "WALE AUTOMÓVEIS";
  const showCompanyName = settings?.show_company_name !== "false";
  const nameParts = companyName.split(" ");
  const firstPart = nameParts.slice(0, -1).join(" ") || companyName;
  const lastPart = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

  const isHomePage = location.pathname === "/";

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const id = href.replace("#", "");
      if (isHomePage) {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else {
        navigate("/", { state: { scrollTo: id } });
      }
    }
  }, [isHomePage, navigate]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-14 sm:h-16 md:h-20">
        <a href={isHomePage ? "#home" : "/"} className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {showLogo && <img src={logoSrc} alt={companyName} className="h-7 sm:h-8 md:h-10 lg:h-11 w-auto object-contain flex-shrink-0" />}
          {showCompanyName && (
            <span className="font-display font-bold text-sm sm:text-base md:text-lg tracking-wider text-foreground truncate">
              {firstPart}{lastPart && <> <span className="text-gradient">{lastPart}</span></>}
            </span>
          )}
        </a>

        {/* Desktop nav with gradient hover effect */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="relative group flex items-center gap-2 px-4 py-2 rounded-lg font-display text-sm font-semibold tracking-wider text-muted-foreground transition-all duration-300 overflow-hidden hover:text-primary-foreground"
            >
              {/* Gradient bg on hover */}
              <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, hsl(208 79% 30%), hsl(200 85% 50%))' }} />
              {/* Blur glow */}
              <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, hsl(208 79% 30%), hsl(200 85% 50%))' }} />

              {/* Icon */}
              <span className="relative z-10 flex items-center justify-center text-primary group-hover:text-primary-foreground transition-colors duration-300">
                {iconMap[item.label]}
              </span>
              {/* Label */}
              <span className="relative z-10">{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Search size={20} />
          </button>
          {socialNetworks.length > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              {socialNetworks.map((net, i) => (
                <a key={i} href={net.url} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                  <SocialIcon type={net.type} />
                </a>
              ))}
            </div>
          )}
        </div>

        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-t border-border overflow-hidden"
          >
            <nav className="flex flex-col p-4 gap-2">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => { handleNavClick(e, item.href); setMobileOpen(false); }}
                  className="relative group flex items-center gap-3 px-4 py-3 rounded-lg font-display text-sm font-semibold tracking-wider text-muted-foreground transition-all duration-300 overflow-hidden hover:text-primary-foreground"
                >
                  <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, hsl(208 79% 30%), hsl(200 85% 50%))' }} />
                  <span className="relative z-10 flex items-center justify-center text-primary group-hover:text-primary-foreground transition-colors duration-300">
                    {iconMap[item.label]}
                  </span>
                  <span className="relative z-10">{item.label}</span>
                </a>
              ))}
              {socialNetworks.length > 0 && (
                <div className="flex items-center gap-3 pt-2 border-t border-border text-muted-foreground">
                  {socialNetworks.map((net, i) => (
                    <a key={i} href={net.url} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                      <SocialIcon type={net.type} />
                    </a>
                  ))}
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
