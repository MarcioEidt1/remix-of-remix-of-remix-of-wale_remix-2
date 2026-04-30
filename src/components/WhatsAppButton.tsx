import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";

const WhatsAppButton = () => {
  const { data: settings } = useSiteSettings();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  // Check if we're on a vehicle detail page
  const isVehiclePage = location.pathname.startsWith("/veiculo/") && !!params.id;

  const { data: vehicle } = useQuery({
    queryKey: ["vehicle-whatsapp", params.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("brand, model, version, display_name, year, price")
        .eq("id", params.id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isVehiclePage,
  });

  const whatsappNumber = settings?.whatsapp || "5511999999999";
  const whatsappCustomLink = settings?.whatsapp_custom_link;

  let message = "Olá! Gostaria de mais informações.";

  if (isVehiclePage && vehicle) {
    const name = vehicle.display_name || `${vehicle.brand} ${vehicle.model} ${vehicle.version}`;
    const price = Number(vehicle.price).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    });
    message = `Olá! Tenho interesse no ${name} ${vehicle.year} - ${price}. Podemos conversar?`;
  }

  const buildHref = () => {
    if (whatsappCustomLink) {
      const url = new URL(whatsappCustomLink);
      if (isVehiclePage && vehicle) {
        const name = vehicle.display_name || `${vehicle.brand} ${vehicle.model} ${vehicle.version}`.trim();
        const price = Number(vehicle.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
        url.searchParams.set("text", `Olá, vim do site e tenho interesse nesse veículo: ${name} ${vehicle.year} - ${price}`);
      } else {
        url.searchParams.set("text", "Olá! Gostaria de mais informações.");
      }
      return url.toString();
    }
    return `https://api.whatsapp.com/send/?phone=${encodeURIComponent(whatsappNumber)}&text=${encodeURIComponent(message)}`;
  };

  const href = buildHref();

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[hsl(142,70%,45%)] text-primary-foreground shadow-lg hover:scale-110 transition-transform"
      aria-label="WhatsApp"
    >
      <WhatsAppIcon size={28} />
    </a>
  );
};

export default WhatsAppButton;
