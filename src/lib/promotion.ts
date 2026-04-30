// Helpers for vehicle promotion logic

export interface PromotionFields {
  is_promotion?: boolean | null;
  promotion_price?: number | string | null;
  promotion_label?: string | null;
  promotion_until?: string | null; // ISO date YYYY-MM-DD
  price: number | string;
}

export interface ActivePromotion {
  active: boolean;
  label: string;
  promoPrice: number;
  originalPrice: number;
}

export function getPromotion(v: PromotionFields): ActivePromotion {
  const original = Number(v.price) || 0;
  const promo = v.promotion_price != null ? Number(v.promotion_price) : 0;
  let active = !!v.is_promotion && promo > 0 && promo < original;

  if (active && v.promotion_until) {
    const until = new Date(v.promotion_until + "T23:59:59");
    if (!isNaN(until.getTime()) && until.getTime() < Date.now()) {
      active = false;
    }
  }

  return {
    active,
    label: (v.promotion_label || "OFERTA").toUpperCase(),
    promoPrice: promo,
    originalPrice: original,
  };
}

export const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
