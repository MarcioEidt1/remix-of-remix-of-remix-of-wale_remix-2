import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import heroShowroom from "@/assets/hero-showroom.jpg";

const fallbackSlides = [
  {
    image: heroShowroom,
    title: "QUALIDADE E CONFIANÇA",
    subtitle: "Os melhores seminovos você encontra aqui",
    link: "#veiculos",
  },
];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);

  const { data: banners } = useQuery({
    queryKey: ["public-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const slides = banners && banners.length > 0
    ? banners.map((b) => ({
        image: b.image_url,
        title: b.title,
        subtitle: b.subtitle || "",
        link: b.link || "#veiculos",
      }))
    : fallbackSlides;

  useEffect(() => {
    setCurrent(0);
  }, [banners]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent((c) => (c + 1) % slides.length);

  return (
    <section id="home" className="relative h-[70vh] md:h-[85vh] overflow-hidden mt-16 md:mt-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <img
            src={slides[current].image}
            alt={slides[current].title}
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex items-end pb-16 md:pb-24">
        <div className="container">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="font-display font-black text-3xl md:text-6xl lg:text-7xl text-foreground leading-tight">
                {slides[current].title.split(" ").map((word, i) => (
                  <span key={i}>
                    {i > 0 && " "}
                    {i === 0 ? <span className="text-gradient">{word}</span> : word}
                  </span>
                ))}
              </h1>
              <p className="mt-4 text-lg md:text-xl text-secondary-foreground max-w-xl">
                {slides[current].subtitle}
              </p>
              <a
                href={slides[current].link}
                className="inline-block mt-6 px-8 py-3 bg-gradient-primary font-display font-bold text-sm tracking-wider text-primary-foreground rounded-sm hover:opacity-90 transition-opacity shadow-glow"
              >
                VER ESTOQUE
              </a>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-foreground/60 hover:text-foreground transition-colors"
      >
        <ChevronLeft size={36} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-foreground/60 hover:text-foreground transition-colors"
      >
        <ChevronRight size={36} />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-3 h-1 rounded-full transition-all ${
              i === current ? "bg-primary w-8" : "bg-foreground/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
