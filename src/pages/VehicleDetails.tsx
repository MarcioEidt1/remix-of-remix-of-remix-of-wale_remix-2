import { useState } from "react";
import PromoBadge from "@/components/PromoBadge";
import { getPromotion, formatBRL } from "@/lib/promotion";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Gauge, Fuel, Settings2, Calendar, Palette, X, ShieldCheck } from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { objectPositionFor, resolveImagePosition } from "@/lib/imagePosition";

const VehicleDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: settings } = useSiteSettings();
  const whatsappNumber = settings?.whatsapp || "5511999999999";
  const whatsappCustomLink = settings?.whatsapp_custom_link;

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, brand, model, version, display_name, year, year_model, km, fuel, transmission, color, internal_color, doors, power_cv, price, image_url, image_position, highlights, accessories, description, video_url, is_active, status, is_promotion, promotion_price, promotion_label, promotion_until, featured, show_on_website, factory_warranty_date, created_at, updated_at")
        .eq("id", id!)
        .single();
      if (error) throw error;

      const { data: imgs } = await supabase
        .from("vehicle_images")
        .select("image_url, image_position")
        .eq("vehicle_id", id!)
        .order("sort_order", { ascending: true });

      const vehicleDefaultPos = (data as any).image_position || "center";
      const extraImages = (imgs || []).map((i: any) => ({
        url: i.image_url,
        position: resolveImagePosition(i.image_position, vehicleDefaultPos),
      }));
      const mainImage = data.image_url
        ? [{ url: data.image_url, position: vehicleDefaultPos }]
        : [];
      const allImages = [...mainImage, ...extraImages];
      const finalImages = allImages.length > 0
        ? allImages
        : [{ url: "/placeholder.svg", position: "center" as const }];

      return { ...data, allImages: finalImages };
    },
    enabled: !!id,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-lg">Veículo não encontrado.</p>
        <Link to="/">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
        </Link>
      </div>
    );
  }

  const images = vehicle.allImages;
  const promo = getPromotion({
    is_promotion: (vehicle as any).is_promotion,
    promotion_price: (vehicle as any).promotion_price,
    promotion_label: (vehicle as any).promotion_label,
    promotion_until: (vehicle as any).promotion_until,
    price: vehicle.price,
  });
  const price = formatBRL(Number(vehicle.price));
  const promoPriceFormatted = promo.active ? formatBRL(promo.promoPrice) : "";

  const vehicleDisplayName = vehicle.display_name || `${vehicle.brand} ${vehicle.model} ${vehicle.version}`;
  const whatsappMsg = encodeURIComponent(
    `Olá! Tenho interesse no ${vehicleDisplayName} ${vehicle.year} - ${price}. Podemos conversar?`
  );
  const buildWhatsappLink = () => {
    if (whatsappCustomLink) {
      const url = new URL(whatsappCustomLink);
      url.searchParams.set("text", `Olá, vim do site e tenho interesse nesse veículo: ${vehicleDisplayName} ${vehicle.year} - ${price}`);
      return url.toString();
    }
    return `https://api.whatsapp.com/send/?phone=${whatsappNumber.replace(/\D/g, "")}&text=${whatsappMsg}`;
  };
  const whatsappLink = buildWhatsappLink();

  const goTo = (dir: -1 | 1) => {
    setCurrentIndex((prev) => (prev + dir + images.length) % images.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container max-w-6xl">
          {/* Back */}
          <Link to="/#veiculos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Voltar aos veículos
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gallery */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
              {/* Main image */}
              <div
                className="relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer group border border-border"
                onClick={() => setLightboxOpen(true)}
              >
                <img
                  src={images[currentIndex].url}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  loading="lazy"
                  style={{ objectPosition: objectPositionFor(images[currentIndex].position) }}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {promo.active && (
                  <div className="absolute top-4 right-4 z-10">
                    <PromoBadge label={promo.label} size="lg" />
                  </div>
                )}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); goTo(-1); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-background/70 backdrop-blur-sm rounded-full text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); goTo(1); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-background/70 backdrop-blur-sm rounded-full text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-background/70 backdrop-blur-sm rounded text-xs text-foreground">
                      {currentIndex + 1}/{images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`flex-shrink-0 w-[60px] aspect-[3/4] rounded-md overflow-hidden border-2 transition-colors ${
                        i === currentIndex ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt=""
                        loading="lazy"
                        style={{ objectPosition: objectPositionFor(img.position) }}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Details */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
              {/* Highlights */}
              {vehicle.highlights && vehicle.highlights.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {vehicle.highlights.map((h: string) => (
                    <span key={h} className="px-2 py-0.5 bg-primary/90 text-primary-foreground text-[10px] font-display font-bold tracking-wider rounded-sm uppercase">
                      {h}
                    </span>
                  ))}
                </div>
              )}

              <p className="font-display text-sm text-primary font-bold tracking-wider uppercase">{vehicle.brand}</p>
              <h1 className="font-display font-black text-2xl md:text-3xl text-foreground mt-1 leading-tight">
                {vehicle.display_name || `${vehicle.model} ${vehicle.version}`}
              </h1>

              {promo.active ? (
                <div className="mt-4">
                  <p className="text-sm md:text-base text-muted-foreground line-through">
                    De {price}
                  </p>
                  <p className="font-display font-black text-3xl md:text-4xl text-red-500 leading-tight">
                    por {promoPriceFormatted}
                  </p>
                </div>
              ) : (
                <p className="font-display font-black text-3xl md:text-4xl text-foreground mt-4">{price}</p>
              )}

              {/* Specs grid */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                {[
                  { icon: Calendar, label: "Ano", value: vehicle.year },
                  { icon: Gauge, label: "Km", value: `${vehicle.km.toLocaleString("pt-BR")} km` },
                  { icon: Fuel, label: "Combustível", value: vehicle.fuel },
                  { icon: Settings2, label: "Câmbio", value: vehicle.transmission },
                  { icon: Palette, label: "Cor", value: vehicle.color },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                    <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-semibold text-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Factory Warranty */}
              {vehicle.factory_warranty_date && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border mt-3">
                  <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Garantia de Fábrica</p>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(vehicle.factory_warranty_date + "T00:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              )}

              {vehicle.description && (
                <div className="mt-6">
                  <h2 className="font-display font-bold text-foreground mb-2">Descrição</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{vehicle.description}</p>
                </div>
              )}

              {/* WhatsApp CTA */}
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 w-full inline-flex items-center justify-center gap-2 bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)] text-white font-display font-bold text-base py-4 px-6 rounded-lg transition-colors"
              >
                <WhatsAppIcon size={20} />
                Tenho interesse neste veículo
              </a>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button className="absolute top-4 right-4 p-2 text-foreground hover:text-primary transition-colors" onClick={() => setLightboxOpen(false)}>
              <X size={28} />
            </button>

            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-foreground hover:text-primary transition-colors"
              onClick={(e) => { e.stopPropagation(); goTo(-1); }}
            >
              <ChevronLeft size={32} />
            </button>

            <div
              className="relative aspect-[3/4] max-h-[85vh] rounded-lg overflow-hidden bg-background/40"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={images[currentIndex].url}
                alt=""
                loading="lazy"
                style={{ objectPosition: objectPositionFor(images[currentIndex].position) }}
                className="w-full h-full object-cover"
              />
            </div>

            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-foreground hover:text-primary transition-colors"
              onClick={(e) => { e.stopPropagation(); goTo(1); }}
            >
              <ChevronRight size={32} />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${i === currentIndex ? "bg-primary" : "bg-foreground/30"}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default VehicleDetails;
