// Public JSON Feed - lightweight, ideal for AI consumption
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  buildTitle,
  buildBadges,
  buildPromoMeta,
  buildDescription,
  buildCondition,
  vehicleUrl,
} from "../_shared/feed-mapping.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: settings } = await supabase
      .from("site_settings")
      .select("key,value")
      .in("key", ["feed_json_enabled", "feed_cache_seconds", "feed_detail_level", "feed_site_url"]);

    const cfg = Object.fromEntries((settings ?? []).map((s: any) => [s.key, s.value]));
    if (cfg.feed_json_enabled === "false") {
      return new Response(JSON.stringify({ error: "Feed disabled" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cacheSeconds = parseInt(cfg.feed_cache_seconds || "300", 10);
    const detailLevel = cfg.feed_detail_level || "public";
    const siteUrl = (cfg.feed_site_url || "").replace(/\/$/, "") ||
      req.headers.get("origin") || "";

    const baseFields = "id,brand,model,version,year,year_model,km,fuel,transmission,price,color,image_url,display_name,highlights,is_promotion,promotion_price,promotion_label,promotion_until,featured";
    const fullFields = `${baseFields},description,doors,power_cv,accessories,internal_color,video_url,factory_warranty_date`;

    const { data: vehicles } = await supabase
      .from("vehicles")
      .select(detailLevel === "full" ? fullFields : baseFields)
      .eq("is_active", true)
      .eq("show_on_website", true)
      .order("updated_at", { ascending: false });

    const items = (vehicles ?? []).map((v: any) => {
      const title = buildTitle(v);
      const promo = buildPromoMeta(v);
      const badges = buildBadges(v);
      const condition = buildCondition(v);

      const base: Record<string, unknown> = {
        id: v.id,
        title,
        url: vehicleUrl(siteUrl, v.id),
        image: v.image_url || null,
        brand: v.brand || null,
        model: v.model || null,
        version: v.version || null,
        year: v.year || null,
        year_model: v.year_model || null,
        km: v.km ?? 0,
        fuel: v.fuel || null,
        transmission: v.transmission || null,
        color: v.color || null,
        condition,
        price: Number(v.price) || 0,
        // Promotion fields (always present, null when inactive)
        promo_price: promo.price,
        promo_label: promo.label,
        promo_until: promo.until,
        promo_discount_pct: promo.discountPct || null,
        promo_savings: promo.savings || null,
        // Consolidated badges (always an array, never null)
        badges,
        featured: !!v.featured,
        highlights: Array.isArray(v.highlights) ? v.highlights : [],
      };

      if (detailLevel === "full") {
        base.description = buildDescription(v);
        base.doors = v.doors ?? null;
        base.power_cv = v.power_cv || null;
        base.accessories = Array.isArray(v.accessories) ? v.accessories : [];
        base.internal_color = v.internal_color || null;
        base.video_url = v.video_url || null;
        base.factory_warranty_date = v.factory_warranty_date || null;
      }
      return base;
    });

    const payload = {
      version: "1.1",
      title: "Catálogo de Veículos",
      home_page_url: siteUrl,
      updated_at: new Date().toISOString(),
      detail_level: detailLevel,
      count: items.length,
      items,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`,
      },
    });
  } catch (err) {
    console.error("feed-json error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
