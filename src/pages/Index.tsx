import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import VehiclesSection from "@/components/VehiclesSection";
import AboutSection from "@/components/AboutSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;
    if (state?.scrollTo) {
      setTimeout(() => {
        const el = document.getElementById(state.scrollTo!);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <VehiclesSection />
      <AboutSection />
      <TestimonialsSection />
      <ContactSection />
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
