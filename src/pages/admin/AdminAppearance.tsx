import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import ImageUpload from "@/components/admin/ImageUpload";
import { Save, Plus, Trash2, GripVertical } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface SocialNetwork {
  type: string;
  url: string;
}

interface AboutStat {
  value: string;
  label: string;
}

const socialOptions = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "twitter", label: "X (Twitter)" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "whatsapp", label: "WhatsApp" },
];

const AdminAppearance = () => {
  const queryClient = useQueryClient();
  const [companyName, setCompanyName] = useState("");
  const [showCompanyName, setShowCompanyName] = useState(true);
  const [logoUrl, setLogoUrl] = useState("");
  const [showLogo, setShowLogo] = useState(true);
  const [socialNetworks, setSocialNetworks] = useState<SocialNetwork[]>([]);
  const [mapsEmbed, setMapsEmbed] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappCustomLink, setWhatsappCustomLink] = useState("");
  const [email, setEmail] = useState("");
  const [businessHours, setBusinessHours] = useState("");

  // About section state
  const [aboutTitle, setAboutTitle] = useState("Conheça a");
  const [aboutTitleHighlight, setAboutTitleHighlight] = useState("Wale Automóveis");
  const [aboutText1, setAboutText1] = useState("");
  const [aboutText2, setAboutText2] = useState("");
  const [aboutImages, setAboutImages] = useState<string[]>([]);
  const [aboutStats, setAboutStats] = useState<AboutStat[]>([
    { value: "500+", label: "Veículos vendidos" },
    { value: "10+", label: "Anos de experiência" },
    { value: "100%", label: "Satisfação" },
    { value: "5★", label: "Avaliação Google" },
  ]);

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

    setCompanyName(map.company_name || "WALE AUTOMÓVEIS");
    setShowCompanyName(map.show_company_name !== "false");
    setLogoUrl(map.logo_url || "");
    setShowLogo(map.show_logo !== "false");
    setAddress(map.address || "");
    setMapsEmbed(map.google_maps_embed || "");
    setPhone(map.phone || "");
    setWhatsapp(map.whatsapp || "");
    setWhatsappCustomLink(map.whatsapp_custom_link || "");
    setEmail(map.email || "");
    setBusinessHours(map.business_hours || "Seg a Sex: 08h às 18h | Sáb: 08h às 13h");

    try {
      const nets = JSON.parse(map.social_networks || "[]");
      setSocialNetworks(nets.length ? nets : []);
    } catch { setSocialNetworks([]); }

    // About section
    setAboutTitle(map.about_title || "Conheça a");
    setAboutTitleHighlight(map.about_title_highlight || "Wale Automóveis");
    setAboutText1(map.about_text_1 || "A Wale Automóveis é uma revenda de carros seminovos comprometida com qualidade e transparência. Nossos veículos passam por rigorosa avaliação mecânica e estética antes de chegarem ao showroom.");
    setAboutText2(map.about_text_2 || "Com anos de experiência no mercado automotivo, oferecemos as melhores condições de financiamento e um atendimento personalizado para que você encontre o carro ideal.");

    try {
      const imgs = JSON.parse(map.about_images || "[]");
      setAboutImages(imgs);
    } catch { setAboutImages([]); }

    try {
      const stats = JSON.parse(map.about_stats || "[]");
      if (stats.length) setAboutStats(stats);
    } catch {}
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates: Record<string, string> = {
        company_name: companyName,
        show_company_name: String(showCompanyName),
        logo_url: logoUrl,
        show_logo: String(showLogo),
        social_networks: JSON.stringify(socialNetworks),
        google_maps_embed: mapsEmbed,
        address,
        phone,
        whatsapp,
        whatsapp_custom_link: whatsappCustomLink,
        email,
        business_hours: businessHours,
        about_title: aboutTitle,
        about_title_highlight: aboutTitleHighlight,
        about_text_1: aboutText1,
        about_text_2: aboutText2,
        about_images: JSON.stringify(aboutImages),
        about_stats: JSON.stringify(aboutStats),
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
      toast.success("Aparência salva com sucesso!");
    },
    onError: () => toast.error("Erro ao salvar."),
  });

  const addSocial = () => setSocialNetworks([...socialNetworks, { type: "instagram", url: "" }]);
  const removeSocial = (i: number) => setSocialNetworks(socialNetworks.filter((_, idx) => idx !== i));
  const updateSocial = (i: number, field: keyof SocialNetwork, value: string) => {
    const copy = [...socialNetworks];
    copy[i] = { ...copy[i], [field]: value };
    setSocialNetworks(copy);
  };

  // About images helpers
  const addAboutImage = (url: string) => {
    if (aboutImages.length < 10) {
      setAboutImages([...aboutImages, url]);
    }
  };
  const removeAboutImage = (i: number) => setAboutImages(aboutImages.filter((_, idx) => idx !== i));

  // About stats helpers
  const addStat = () => {
    if (aboutStats.length < 6) {
      setAboutStats([...aboutStats, { value: "", label: "" }]);
    }
  };
  const removeStat = (i: number) => setAboutStats(aboutStats.filter((_, idx) => idx !== i));
  const updateStat = (i: number, field: keyof AboutStat, value: string) => {
    const copy = [...aboutStats];
    copy[i] = { ...copy[i], [field]: value };
    setAboutStats(copy);
  };

  const whatsappPreview = whatsapp ? `https://api.whatsapp.com/send/?phone=${whatsapp}` : "";

  const inputClass = "w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-sm text-sm focus:outline-none focus:border-primary transition-colors";

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Aparência do Site</h1>
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
        {/* Company Name */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-foreground">Nome da Empresa</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{showCompanyName ? "Visível" : "Oculto"}</span>
              <Switch checked={showCompanyName} onCheckedChange={setShowCompanyName} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Nome exibido no cabeçalho e rodapé do site.
          </p>
          <div className="max-w-sm">
            <input
              className={inputClass}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Nome da empresa"
              disabled={!showCompanyName}
            />
          </div>
        </div>

        {/* Logo */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-foreground">Logo do Site</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{showLogo ? "Visível" : "Oculto"}</span>
              <Switch checked={showLogo} onCheckedChange={setShowLogo} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Envie a logo da empresa. Recomendado: formato PNG transparente, máximo 200x80px.
          </p>
          <div className={`max-w-sm ${!showLogo ? "opacity-50 pointer-events-none" : ""}`}>
            <ImageUpload
              bucket="banner-images"
              value={logoUrl}
              onChange={setLogoUrl}
              label="Logo"
              hint="SVG ou PNG transparente recomendado (sem compressão)"
              preserveOriginal
              accept="image/svg+xml,image/png,image/webp,image/jpeg"
            />
          </div>
        </div>

        {/* ======== ABOUT SECTION ======== */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-display font-bold text-lg text-foreground mb-4">Seção "Conheça a Wale"</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Gerencie o título, textos, fotos (carrossel até 10) e estatísticas da seção sobre a empresa.
          </p>

          {/* Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Título (parte 1)</label>
              <input
                className={inputClass}
                value={aboutTitle}
                onChange={(e) => setAboutTitle(e.target.value)}
                placeholder="Conheça a"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Título destaque (parte 2)</label>
              <input
                className={inputClass}
                value={aboutTitleHighlight}
                onChange={(e) => setAboutTitleHighlight(e.target.value)}
                placeholder="Wale Automóveis"
              />
              <p className="text-xs text-muted-foreground mt-1">Esta parte aparece com gradiente azul.</p>
            </div>
          </div>

          {/* Texts */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Parágrafo 1</label>
              <textarea
                className={inputClass + " resize-none"}
                rows={3}
                value={aboutText1}
                onChange={(e) => setAboutText1(e.target.value)}
                placeholder="Texto principal sobre a empresa..."
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Parágrafo 2</label>
              <textarea
                className={inputClass + " resize-none"}
                rows={3}
                value={aboutText2}
                onChange={(e) => setAboutText2(e.target.value)}
                placeholder="Texto complementar..."
              />
            </div>
          </div>

          {/* Images carousel */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-muted-foreground font-medium">
                Fotos do carrossel ({aboutImages.length}/10)
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-3">
              {aboutImages.map((img, i) => (
                <div key={i} className="relative group aspect-[4/3] rounded-md overflow-hidden border border-border">
                  <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeAboutImage(i)}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-background/70 text-foreground text-[10px] px-1.5 py-0.5 rounded">
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>
            {aboutImages.length < 10 && (
              <div className="max-w-xs">
                <ImageUpload
                  bucket="banner-images"
                  value=""
                  onChange={(url) => addAboutImage(url)}
                  label="Adicionar foto"
                  hint="JPG ou PNG, até 10 fotos"
                  maxWidth={1200}
                  maxHeight={800}
                  quality={0.85}
                />
              </div>
            )}
          </div>

          {/* Stats */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-muted-foreground font-medium">
                Estatísticas ({aboutStats.length}/6)
              </label>
              {aboutStats.length < 6 && (
                <button
                  onClick={addStat}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-sm hover:opacity-90"
                >
                  <Plus size={14} /> Adicionar
                </button>
              )}
            </div>
            <div className="space-y-2">
              {aboutStats.map((stat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <GripVertical size={14} className="text-muted-foreground flex-shrink-0" />
                  <input
                    className={inputClass + " max-w-[120px]"}
                    value={stat.value}
                    onChange={(e) => updateStat(i, "value", e.target.value)}
                    placeholder="500+"
                  />
                  <input
                    className={inputClass}
                    value={stat.label}
                    onChange={(e) => updateStat(i, "label", e.target.value)}
                    placeholder="Veículos vendidos"
                  />
                  <button
                    onClick={() => removeStat(i)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-display font-bold text-lg text-foreground mb-4">Informações de Contato</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Dados exibidos na seção de contato do site e no rodapé.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Telefone</label>
              <input
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">E-mail</label>
              <input
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@empresa.com"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-display font-bold text-lg text-foreground mb-4">WhatsApp</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">
                Número do WhatsApp (apenas números com DDI)
              </label>
              <input
                className={inputClass}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="5511999999999"
              />
              {whatsappPreview && (
                <p className="text-xs text-muted-foreground mt-1">
                  Link gerado: <span className="text-primary break-all">{whatsappPreview}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Este número será usado para gerar automaticamente o link do botão WhatsApp do site.
              </p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">
                Link personalizado (opcional)
              </label>
              <input
                className={inputClass}
                value={whatsappCustomLink}
                onChange={(e) => setWhatsappCustomLink(e.target.value)}
                placeholder="https://wa.me/message/... ou qualquer outro link"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Se preenchido, este link será usado no lugar do link gerado pelo número acima.
              </p>
            </div>
          </div>
        </div>

        {/* Business Hours */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-display font-bold text-lg text-foreground mb-4">Horário de Funcionamento</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Exibido na seção de contato do site. Use "|" ou quebra de linha para separar os dias.
          </p>
          <textarea
            className={inputClass + " resize-none"}
            rows={3}
            value={businessHours}
            onChange={(e) => setBusinessHours(e.target.value)}
            placeholder="Seg a Sex: 08h às 18h | Sáb: 08h às 13h"
          />
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-foreground">Redes Sociais</h2>
            <button
              onClick={addSocial}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-sm hover:opacity-90"
            >
              <Plus size={14} /> Adicionar
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Adicione as redes sociais que aparecerão no cabeçalho e rodapé do site.
          </p>
          <div className="space-y-3">
            {socialNetworks.map((net, i) => (
              <div key={i} className="flex items-center gap-3">
                <select
                  className={inputClass + " max-w-[160px]"}
                  value={net.type}
                  onChange={(e) => updateSocial(i, "type", e.target.value)}
                >
                  {socialOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <input
                  className={inputClass}
                  placeholder="URL completa (ex: https://instagram.com/wale)"
                  value={net.url}
                  onChange={(e) => updateSocial(i, "url", e.target.value)}
                />
                <button
                  onClick={() => removeSocial(i)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {socialNetworks.length === 0 && (
              <p className="text-sm text-muted-foreground italic">Nenhuma rede social adicionada.</p>
            )}
          </div>
        </div>

        {/* Address & Google Maps */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-display font-bold text-lg text-foreground mb-4">Endereço e Mapa</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Endereço completo</label>
              <input
                className={inputClass}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua Exemplo, 123 - Bairro, Cidade - UF"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Google Maps Embed URL</label>
              <input
                className={inputClass}
                value={mapsEmbed}
                onChange={(e) => setMapsEmbed(e.target.value)}
                placeholder="https://www.google.com/maps/embed?pb=..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Acesse o Google Maps → busque seu endereço → clique em "Compartilhar" → "Incorporar mapa" → copie apenas a URL do src do iframe.
              </p>
            </div>
            {mapsEmbed && (
              <div className="mt-2">
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Pré-visualização</label>
                <iframe
                  src={mapsEmbed}
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-md"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAppearance;
