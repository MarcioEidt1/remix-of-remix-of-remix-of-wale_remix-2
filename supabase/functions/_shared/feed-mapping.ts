// Shared mapping utilities for feed-xml and feed-json
// Ensures consistent titles, labels and badges even when fields are empty.

const cap = (s: string) =>
  s.replace(/\b([a-zà-ú])/g, (m) => m.toUpperCase());

const clean = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  return String(v).replace(/\s+/g, " ").trim();
};

export function buildTitle(v: any): string {
  // Priority 1: display_name (project rule)
  const display = clean(v.display_name);
  if (display) return display.slice(0, 150);

  // Priority 2: brand + model + version + year
  const brand = cap(clean(v.brand));
  const model = cap(clean(v.model));
  const version = clean(v.version);
  // Year strategy: prefer year_model, fallback to year
  const year = v.year_model || v.year || "";

  const parts = [brand, model, version, year ? String(year) : ""]
    .filter(Boolean);

  let title = parts.join(" ").replace(/\s+/g, " ").trim();
  if (!title) title = `Veículo ${String(v.id || "").slice(0, 8)}`;
  return title.slice(0, 150);
}

export function isPromoActive(v: any): boolean {
  if (!v.is_promotion) return false;
  if (!v.promotion_price || Number(v.promotion_price) <= 0) return false;
  if (v.promotion_until && new Date(v.promotion_until) < new Date()) return false;
  return true;
}

export function buildPromoMeta(v: any) {
  const active = isPromoActive(v);
  if (!active) {
    return { active: false, label: null, discountPct: 0, savings: 0, until: null, price: null };
  }
  const price = Number(v.price) || 0;
  const promo = Number(v.promotion_price) || 0;
  const savings = Math.max(0, price - promo);
  const discountPct = price > 0 ? Math.round((savings / price) * 100) : 0;
  return {
    active: true,
    label: clean(v.promotion_label) || "OFERTA",
    discountPct,
    savings: Number(savings.toFixed(2)),
    until: v.promotion_until || null,
    price: Number(promo.toFixed(2)),
  };
}

export function buildBadges(v: any): string[] {
  const set = new Set<string>();
  if (isPromoActive(v)) set.add(clean(v.promotion_label) || "OFERTA");
  if (v.featured) set.add("Destaque");
  const km = Number(v.km) || 0;
  if (km < 1000) set.add("0KM");
  else if (km < 20000) set.add("Baixa KM");
  if (Array.isArray(v.highlights)) {
    v.highlights.forEach((h: string) => {
      const c = clean(h);
      if (c) set.add(c);
    });
  }
  // Cap to avoid bloated payloads
  return Array.from(set).slice(0, 8);
}

export function buildDescription(v: any): string {
  const existing = clean(v.description);
  if (existing) return existing;
  // Auto-generated fallback
  const brand = cap(clean(v.brand));
  const model = cap(clean(v.model));
  const version = clean(v.version);
  const year = v.year_model || v.year || "";
  const km = v.km != null ? `${Number(v.km).toLocaleString("pt-BR")} km` : "";
  const fuel = clean(v.fuel);
  const trans = clean(v.transmission);
  const color = clean(v.color);
  const bits = [
    [brand, model, version, year].filter(Boolean).join(" "),
    km && `${km}`,
    trans && `câmbio ${trans.toLowerCase()}`,
    fuel && `combustível ${fuel.toLowerCase()}`,
    color && `cor ${color.toLowerCase()}`,
  ].filter(Boolean);
  return bits.join(" · ");
}

export function buildCondition(v: any): "new" | "used" {
  return (Number(v.km) || 0) < 1000 ? "new" : "used";
}

export function vehicleUrl(siteUrl: string, id: string): string {
  const base = (siteUrl || "").replace(/\/$/, "");
  return base ? `${base}/veiculo/${id}` : `/veiculo/${id}`;
}
