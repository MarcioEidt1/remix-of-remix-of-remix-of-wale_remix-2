// Public RSS 2.0 feed (Google Merchant / Meta Catalog compatible)
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

function escapeXml(unsafe: unknown): string {
  return String(unsafe ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

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
      .in("key", ["feed_xml_enabled", "feed_cache_seconds", "feed_detail_level", "feed_site_url"]);

    const cfg = Object.fromEntries((settings ?? []).map((s: any) => [s.key, s.value]));
    if (cfg.feed_xml_enabled === "false") {
      return new Response("Feed disabled", { status: 404, headers: corsHeaders });
    }

    const cacheSeconds = parseInt(cfg.feed_cache_seconds || "300", 10);
    const detailLevel = cfg.feed_detail_level || "public";
    const siteUrl = (cfg.feed_site_url || "").replace(/\/$/, "") ||
      req.headers.get("origin") || "https://example.com";

    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id,brand,model,version,year,year_model,km,fuel,transmission,price,color,image_url,display_name,description,highlights,is_promotion,promotion_price,promotion_label,promotion_until,doors,power_cv,featured")
      .eq("is_active", true)
      .eq("show_on_website", true)
      .order("updated_at", { ascending: false });

    const now = new Date().toUTCString();
    const items = (vehicles ?? []).map((v: any) => {
      const title = buildTitle(v);
      const link = vehicleUrl(siteUrl, v.id);
      const promo = buildPromoMeta(v);
      const badges = buildBadges(v);
      const condition = buildCondition(v);
      const description = buildDescription(v) || title;

      const priceTag = `<g:price>${(Number(v.price) || 0).toFixed(2)} BRL</g:price>`;
      let saleTags = "";
      if (promo.active && promo.price !== null) {
        saleTags = `\n      <g:sale_price>${promo.price.toFixed(2)} BRL</g:sale_price>`;
        if (promo.until) {
          // Google expects ISO interval: start/end
          const start = new Date().toISOString();
          const end = new Date(`${promo.until}T23:59:59Z`).toISOString();
          saleTags += `\n      <g:sale_price_effective_date>${start}/${end}</g:sale_price_effective_date>`;
        }
      }

      // Custom labels: predictable slots regardless of empty fields
      const label0 = promo.active ? (promo.label || "OFERTA") : "";
      const label1 = v.featured ? "Destaque" : "";
      const label2 = badges.filter((b) => b !== promo.label && b !== "Destaque").slice(0, 3).join(" | ");
      const label3 = v.year_model || v.year || "";
      const label4 = v.km != null ? `${v.km} km` : "";

      const extra = detailLevel === "full"
        ? `
      <g:product_detail><g:section_name>Combustível</g:section_name><g:attribute_name>fuel</g:attribute_name><g:attribute_value>${escapeXml(v.fuel)}</g:attribute_value></g:product_detail>
      <g:product_detail><g:section_name>Câmbio</g:section_name><g:attribute_name>transmission</g:attribute_name><g:attribute_value>${escapeXml(v.transmission)}</g:attribute_value></g:product_detail>
      <g:product_detail><g:section_name>Cor</g:section_name><g:attribute_name>color</g:attribute_name><g:attribute_value>${escapeXml(v.color)}</g:attribute_value></g:product_detail>
      <g:product_detail><g:section_name>Portas</g:section_name><g:attribute_name>doors</g:attribute_name><g:attribute_value>${escapeXml(v.doors ?? "")}</g:attribute_value></g:product_detail>
      <g:product_detail><g:section_name>Potência</g:section_name><g:attribute_name>power_cv</g:attribute_name><g:attribute_value>${escapeXml(v.power_cv)}</g:attribute_value></g:product_detail>`
        : "";

      return `    <item>
      <g:id>${escapeXml(v.id)}</g:id>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <description>${escapeXml(description)}</description>
      <g:condition>${condition}</g:condition>
      <g:availability>in stock</g:availability>
      <g:image_link>${escapeXml(v.image_url || "")}</g:image_link>
      ${priceTag}${saleTags}
      <g:brand>${escapeXml(v.brand)}</g:brand>
      <g:mpn>${escapeXml(v.id)}</g:mpn>
      <g:product_type>Veículos &gt; ${escapeXml(v.brand)} &gt; ${escapeXml(v.model)}</g:product_type>
      <g:custom_label_0>${escapeXml(label0)}</g:custom_label_0>
      <g:custom_label_1>${escapeXml(label1)}</g:custom_label_1>
      <g:custom_label_2>${escapeXml(label2)}</g:custom_label_2>
      <g:custom_label_3>${escapeXml(label3)}</g:custom_label_3>
      <g:custom_label_4>${escapeXml(label4)}</g:custom_label_4>${extra}
    </item>`;
    }).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Catálogo de Veículos</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Feed de veículos disponíveis</description>
    <lastBuildDate>${now}</lastBuildDate>
${items}
  </channel>
</rss>`;

    return new Response(xml, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`,
      },
    });
  } catch (err) {
    console.error("feed-xml error", err);
    return new Response(`Error: ${(err as Error).message}`, { status: 500, headers: corsHeaders });
  }
});
