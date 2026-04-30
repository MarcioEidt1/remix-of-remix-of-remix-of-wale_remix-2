import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Award, Users, ThumbsUp, ChevronLeft, ChevronRight } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import aboutTeamFallback from "@/assets/about-team.jpg";

const defaultStats = [
  { value: "500+", label: "Veículos vendidos" },
  { value: "10+", label: "Anos de experiência" },
  { value: "100%", label: "Satisfação" },
  { value: "5★", label: "Avaliação Google" },
];

const statIcons = [ShieldCheck, Award, Users, ThumbsUp, ShieldCheck, Award];

const AboutSection = () => {
  const { data: settings } = useSiteSettings();

  const title = settings?.about_title || "Conheça a";
  const titleHighlight = settings?.about_title_highlight || "Wale Automóveis";
  const text1 = settings?.about_text_1 || "A Wale Automóveis é uma revenda de carros seminovos comprometida com qualidade e transparência. Nossos veículos passam por rigorosa avaliação mecânica e estética antes de chegarem ao showroom.";
  const text2 = settings?.about_text_2 || "Com anos de experiência no mercado automotivo, oferecemos as melhores condições de financiamento e um atendimento personalizado para que você encontre o carro ideal.";

  let images: string[] = [];
  try {
    images = JSON.parse(settings?.about_images || "[]");
  } catch {}
  if (!images.length) images = [aboutTeamFallback];

  let stats = defaultStats;
  try {
    const parsed = JSON.parse(settings?.about_stats || "[]");
    if (parsed.length) stats = parsed;
  } catch {}

  const [currentIndex, setCurrentIndex] = useState(0);
  const hasMultiple = images.length > 1;

  // Auto-advance carousel
  useEffect(() => {
    if (!hasMultiple) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [hasMultiple, images.length]);

  const goTo = useCallback((dir: -1 | 1) => {
    setCurrentIndex((prev) => (prev + dir + images.length) % images.length);
  }, [images.length]);

  return (
    <section id="sobre" className="py-16 md:py-24 bg-surface-elevated">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative rounded-lg overflow-hidden group">
              <img
                src={images[currentIndex]}
                alt="Sobre a empresa"
                loading="lazy"
                width={1200}
                height={800}
                className="w-full h-auto aspect-[4/3] object-cover transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />

              {hasMultiple && (
                <>
                  <button
                    onClick={() => goTo(-1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-background/70 backdrop-blur-sm rounded-full text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => goTo(1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-background/70 backdrop-blur-sm rounded-full text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight size={20} />
                  </button>

                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? "bg-primary" : "bg-foreground/40"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display font-black text-2xl md:text-4xl text-foreground">
              {title} <span className="text-gradient">{titleHighlight}</span>
            </h2>
            {text1 && (
              <p className="mt-4 text-muted-foreground leading-relaxed">{text1}</p>
            )}
            {text2 && (
              <p className="mt-3 text-muted-foreground leading-relaxed">{text2}</p>
            )}

            <div className="grid grid-cols-2 gap-4 mt-8">
              {stats.map((stat, i) => {
                const Icon = statIcons[i % statIcons.length];
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                    <Icon size={24} className="text-primary flex-shrink-0" />
                    <div>
                      <p className="font-display font-black text-lg text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
