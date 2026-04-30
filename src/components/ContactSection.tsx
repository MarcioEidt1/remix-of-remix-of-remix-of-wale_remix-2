import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, MapPin, Clock, Mail } from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { toast } from "sonner";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().max(20).optional(),
  message: z.string().trim().min(1, "Mensagem é obrigatória").max(1000),
});

const ContactSection = () => {
  const { data: settings } = useSiteSettings();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSending(true);
    const { error } = await supabase.from("contacts").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || "",
      message: parsed.data.message,
    });
    if (error) {
      toast.error("Erro ao enviar mensagem.");
    } else {
      toast.success("Mensagem enviada com sucesso!");
      setForm({ name: "", email: "", phone: "", message: "" });
    }
    setSending(false);
  };

  const phone = settings?.phone || "(11) 99999-9999";
  const whatsappNumber = settings?.whatsapp || "5511999999999";
  const whatsappCustomLink = settings?.whatsapp_custom_link;
  const whatsappLink = whatsappCustomLink || `https://api.whatsapp.com/send/?phone=${encodeURIComponent(whatsappNumber)}`;
  const address = settings?.address || "Av. Principal, 1000 - São Paulo, SP";
  const contactEmail = settings?.email || "";
  const businessHours = settings?.business_hours || "Seg a Sex: 08h às 18h | Sáb: 08h às 13h";

  const hoursLines = businessHours.split("|").map((l) => l.trim()).filter(Boolean);

  return (
    <section id="contato" className="py-16 md:py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display font-black text-2xl md:text-4xl text-foreground">
            Entre em <span className="text-gradient">Contato</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Fale conosco pelo WhatsApp ou venha nos visitar. Estamos prontos para ajudar você a encontrar o carro perfeito.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border">
              <Phone size={24} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-display font-bold text-foreground">Telefone / WhatsApp</p>
                <p className="text-muted-foreground text-sm mt-1">{phone}</p>
              </div>
            </div>
            {contactEmail && (
              <div className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border">
                <Mail size={24} className="text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-display font-bold text-foreground">E-mail</p>
                  <p className="text-muted-foreground text-sm mt-1">{contactEmail}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border">
              <MapPin size={24} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-display font-bold text-foreground">Endereço</p>
                <p className="text-muted-foreground text-sm mt-1">{address}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border">
              <Clock size={24} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-display font-bold text-foreground">Horário</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {hoursLines.map((line, i) => (
                    <span key={i}>{line}{i < hoursLines.length - 1 && <br />}</span>
                  ))}
                </p>
              </div>
            </div>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-primary font-display font-bold text-sm tracking-wider text-primary-foreground rounded-sm hover:opacity-90 transition-opacity shadow-glow"
            >
              <WhatsAppIcon size={20} />
              CHAMAR NO WHATSAPP
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-lg border border-border p-6"
          >
            <h3 className="font-display font-bold text-foreground text-lg mb-4">Envie uma mensagem</h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Seu nome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                maxLength={100}
                className="w-full px-4 py-3 bg-secondary text-foreground border border-border rounded-sm font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <input
                type="email"
                placeholder="Seu e-mail"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                maxLength={255}
                className="w-full px-4 py-3 bg-secondary text-foreground border border-border rounded-sm font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <input
                type="tel"
                placeholder="Seu telefone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                maxLength={20}
                className="w-full px-4 py-3 bg-secondary text-foreground border border-border rounded-sm font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <textarea
                placeholder="Mensagem"
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                maxLength={1000}
                className="w-full px-4 py-3 bg-secondary text-foreground border border-border rounded-sm font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 bg-gradient-primary font-display font-bold text-sm tracking-wider text-primary-foreground rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {sending ? "ENVIANDO..." : "ENVIAR MENSAGEM"}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
