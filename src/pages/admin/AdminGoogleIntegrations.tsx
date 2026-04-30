import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Save, BarChart3, Code2, Search, Megaphone, Gauge, ExternalLink, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface GoogleProduct {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  settingKey: string;
  enableKey: string;
  placeholder: string;
  helpUrl: string;
  helpLabel: string;
}

const googleProducts: GoogleProduct[] = [
  {
    id: "analytics",
    title: "Google Analytics 4",
    description: "Rastreie visitas, pageviews, eventos e comportamento dos usuários no seu site.",
    icon: BarChart3,
    color: "from-orange-500 to-yellow-500",
    settingKey: "google_analytics_id",
    enableKey: "google_analytics_enabled",
    placeholder: "G-XXXXXXXXXX",
    helpUrl: "https://analytics.google.com/",
    helpLabel: "Abrir Analytics",
  },
  {
    id: "tag_manager",
    title: "Google Tag Manager",
    description: "Gerencie tags, scripts de terceiros e pixels de conversão em um só lugar.",
    icon: Code2,
    color: "from-blue-500 to-cyan-500",
    settingKey: "google_tag_manager_id",
    enableKey: "google_tag_manager_enabled",
    placeholder: "GTM-XXXXXXX",
    helpUrl: "https://tagmanager.google.com/",
    helpLabel: "Abrir Tag Manager",
  },
  {
    id: "search_console",
    title: "Google Search Console",
    description: "Verifique a propriedade do site e monitore o desempenho de SEO nas buscas.",
    icon: Search,
    color: "from-green-500 to-emerald-500",
    settingKey: "google_search_console_id",
    enableKey: "google_search_console_enabled",
    placeholder: "Meta tag de verificação",
    helpUrl: "https://search.google.com/search-console",
    helpLabel: "Abrir Search Console",
  },
  {
    id: "ads",
    title: "Google Ads",
    description: "Instale o código de conversão e remarketing para suas campanhas de anúncios.",
    icon: Megaphone,
    color: "from-red-500 to-pink-500",
    settingKey: "google_ads_id",
    enableKey: "google_ads_enabled",
    placeholder: "AW-XXXXXXXXX",
    helpUrl: "https://ads.google.com/",
    helpLabel: "Abrir Google Ads",
  },
  {
    id: "pagespeed",
    title: "PageSpeed Insights",
    description: "Adicione o Web Vitals tracking para monitorar performance e Core Web Vitals.",
    icon: Gauge,
    color: "from-purple-500 to-violet-500",
    settingKey: "google_pagespeed_id",
    enableKey: "google_pagespeed_enabled",
    placeholder: "ID do projeto (opcional)",
    helpUrl: "https://pagespeed.web.dev/",
    helpLabel: "Abrir PageSpeed",
  },
];

const AdminGoogleIntegrations = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: settings = [] } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const map: Record<string, string> = {};
    settings.forEach((s) => { map[s.key] = s.value; });
    setForm(map);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const allKeys = googleProducts.flatMap(p => [p.settingKey, p.enableKey]);
      for (const key of allKeys) {
        const value = form[key] || "";
        const exists = settings.some(s => s.key === key);
        if (exists) {
          const { error } = await supabase.from("site_settings").update({ value }).eq("key", key);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("site_settings").insert({ key, value });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Integrações Google salvas!");
    },
    onError: () => toast.error("Erro ao salvar integrações."),
  });

  const isEnabled = (key: string) => form[key] === "true";
  const toggleEnabled = (key: string) => {
    setForm({ ...form, [key]: form[key] === "true" ? "false" : "true" });
  };

  const getStatus = (product: GoogleProduct) => {
    const hasId = !!form[product.settingKey]?.trim();
    const enabled = form[product.enableKey] === "true";
    if (hasId && enabled) return "connected";
    if (hasId && !enabled) return "paused";
    return "disconnected";
  };

  const statusConfig = {
    connected: { label: "Conectado", icon: Check, className: "text-green-500 bg-green-500/10" },
    paused: { label: "Pausado", icon: X, className: "text-yellow-500 bg-yellow-500/10" },
    disconnected: { label: "Não configurado", icon: X, className: "text-muted-foreground bg-muted" },
  };

  const inputClass = "w-full px-3 py-2.5 bg-secondary text-foreground border border-border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            Integrações Google
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure e gerencie os produtos do Google conectados ao seu site.
          </p>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-display font-bold text-sm rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Save size={16} />
          {saveMutation.isPending ? "Salvando..." : "Salvar tudo"}
        </button>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {googleProducts.map((product) => {
          const status = getStatus(product);
          const config = statusConfig[status];
          const StatusIcon = config.icon;
          return (
            <div key={product.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${product.color} flex items-center justify-center flex-shrink-0`}>
                <product.icon size={16} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{product.title.replace("Google ", "")}</p>
                <div className="flex items-center gap-1">
                  <StatusIcon size={10} className={status === "disconnected" ? "text-muted-foreground" : status === "connected" ? "text-green-500" : "text-yellow-500"} />
                  <span className="text-[10px] text-muted-foreground">{config.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Product cards */}
      <div className="space-y-4">
        {googleProducts.map((product) => {
          const status = getStatus(product);
          const enabled = isEnabled(product.enableKey);

          return (
            <div
              key={product.id}
              className={`bg-card border rounded-lg overflow-hidden transition-all ${
                enabled ? "border-primary/30" : "border-border"
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <product.icon size={22} className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-foreground">{product.title}</h3>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusConfig[status].className}`}>
                          {statusConfig[status].label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{product.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <a
                      href={product.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      {product.helpLabel}
                      <ExternalLink size={12} />
                    </a>
                    <Switch
                      checked={enabled}
                      onCheckedChange={() => toggleEnabled(product.enableKey)}
                    />
                  </div>
                </div>

                {/* Input area */}
                <div className="mt-4 ml-16">
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
                    ID de rastreamento
                  </label>
                  <input
                    className={inputClass}
                    placeholder={product.placeholder}
                    value={form[product.settingKey] || ""}
                    onChange={(e) => setForm({ ...form, [product.settingKey]: e.target.value })}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div className="mt-6 bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
        <h4 className="text-sm font-medium text-foreground mb-1">💡 Como funciona?</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Insira os IDs de rastreamento dos produtos Google que deseja usar e ative-os.
          Os scripts serão injetados automaticamente no seu site público.
          Para obter os IDs, acesse o painel de cada produto usando os links acima.
        </p>
      </div>
    </AdminLayout>
  );
};

export default AdminGoogleIntegrations;
