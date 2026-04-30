import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import ImageUpload from "@/components/admin/ImageUpload";
import { Save, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface MenuItem {
  label: string;
  href: string;
}

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [devLogoUrl, setDevLogoUrl] = useState("");
  const [devSiteUrl, setDevSiteUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");

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

    setDevLogoUrl(map.dev_logo_url || "");
    setDevSiteUrl(map.dev_site_url || "");
    setFaviconUrl(map.favicon_url || "");

    try {
      const items = JSON.parse(map.menu_items || "[]");
      setMenuItems(items.length ? items : [
        { label: "HOME", href: "#home" },
        { label: "VEÍCULOS", href: "#veiculos" },
        { label: "A WALE", href: "#sobre" },
        { label: "CONTATO", href: "#contato" },
      ]);
    } catch { setMenuItems([{ label: "HOME", href: "#home" }]); }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates: Record<string, string> = {
        menu_items: JSON.stringify(menuItems),
        dev_logo_url: devLogoUrl,
        dev_site_url: devSiteUrl,
        favicon_url: faviconUrl,
      };
      for (const [key, value] of Object.entries(updates)) {
        const { error } = await supabase
          .from("site_settings")
          .upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: () => toast.error("Erro ao salvar."),
  });

  const addMenuItem = () => setMenuItems([...menuItems, { label: "", href: "" }]);
  const removeMenuItem = (i: number) => setMenuItems(menuItems.filter((_, idx) => idx !== i));
  const updateMenuItem = (i: number, field: keyof MenuItem, value: string) => {
    const copy = [...menuItems];
    copy[i] = { ...copy[i], [field]: value };
    setMenuItems(copy);
  };

  const inputClass = "w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-sm text-sm focus:outline-none focus:border-primary transition-colors";

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Configurações</h1>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-display font-bold text-sm rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Save size={16} />
          {saveMutation.isPending ? "Salvando..." : "Salvar"}
        </button>
      </div>

      <div className="space-y-6">
        {/* Favicon */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-display font-bold text-lg text-foreground mb-4">Favicon do Site</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Ícone exibido na aba do navegador. Recomendado: PNG ou SVG quadrado (ex: 512x512).
          </p>
          <div className="max-w-sm">
            <ImageUpload
              bucket="banner-images"
              value={faviconUrl}
              onChange={setFaviconUrl}
              label="Favicon"
              hint="PNG, SVG, WebP ou ICO. Quadrado recomendado."
              preserveOriginal
              accept="image/svg+xml,image/png,image/webp,image/x-icon,image/vnd.microsoft.icon"
            />
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-foreground">Itens do Menu</h2>
            <button
              onClick={addMenuItem}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-sm hover:opacity-90"
            >
              <Plus size={14} /> Adicionar
            </button>
          </div>
          <div className="space-y-3">
            {menuItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <GripVertical size={16} className="text-muted-foreground flex-shrink-0" />
                <input
                  className={inputClass}
                  placeholder="Nome (ex: HOME)"
                  value={item.label}
                  onChange={(e) => updateMenuItem(i, "label", e.target.value)}
                />
                <input
                  className={inputClass}
                  placeholder="Link (ex: #home)"
                  value={item.href}
                  onChange={(e) => updateMenuItem(i, "href", e.target.value)}
                />
                <button
                  onClick={() => removeMenuItem(i)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Developer Logo */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-display font-bold text-lg text-foreground mb-4">Logo do Desenvolvedor</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Logo e link do site do desenvolvedor que aparecerão no rodapé do site.
          </p>
          <div className="space-y-4">
            <div className="max-w-sm">
              <ImageUpload
                bucket="banner-images"
                value={devLogoUrl}
                onChange={setDevLogoUrl}
                label="Logo do Desenvolvedor"
                hint="SVG ou PNG transparente recomendado (sem compressão)"
                preserveOriginal
                accept="image/svg+xml,image/png,image/webp,image/jpeg"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Link do site do desenvolvedor</label>
              <input
                className={inputClass}
                value={devSiteUrl}
                onChange={(e) => setDevSiteUrl(e.target.value)}
                placeholder="https://www.seusite.com.br"
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;