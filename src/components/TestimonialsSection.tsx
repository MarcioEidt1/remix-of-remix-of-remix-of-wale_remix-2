import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CircularTestimonials } from "@/components/ui/circular-testimonials";
import { motion } from "framer-motion";

const TestimonialsSection = () => {
  const { data: testimonials = [] } = useQuery({
    queryKey: ["public-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (testimonials.length === 0) return null;

  const mapped = testimonials.map((t) => ({
    quote: t.quote,
    name: t.name,
    designation: t.designation,
    src: t.image_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
  }));

  return (
    <section id="depoimentos" className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            O que nossos <span className="text-gradient">clientes</span> dizem
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Depoimentos de quem confiou na Wale Automóveis
          </p>
        </motion.div>
        <CircularTestimonials
          testimonials={mapped}
          autoplay
          colors={{
            name: "hsl(var(--foreground))",
            designation: "hsl(var(--muted-foreground))",
            testimony: "hsl(var(--muted-foreground))",
            arrowBackground: "hsl(var(--primary))",
            arrowForeground: "hsl(var(--primary-foreground))",
            arrowHoverBackground: "hsl(var(--accent))",
          }}
        />
      </div>
    </section>
  );
};

export default TestimonialsSection;
