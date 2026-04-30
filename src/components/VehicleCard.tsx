import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Gauge, Fuel, Settings2 } from "lucide-react";
import type { Vehicle } from "@/data/mockVehicles";
import PromoBadge from "@/components/PromoBadge";
import { getPromotion, formatBRL } from "@/lib/promotion";
import { objectPositionFor } from "@/lib/imagePosition";

interface VehicleCardProps {
  vehicle: Vehicle;
  index: number;
}

const VehicleCard = ({ vehicle, index }: VehicleCardProps) => {
  const allImages = vehicle.images && vehicle.images.length > 0
    ? vehicle.images
    : [vehicle.image];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasMultiple = allImages.length > 1;

  const formattedPrice = formatBRL(vehicle.price);
  const promo = getPromotion({
    is_promotion: (vehicle as any).is_promotion,
    promotion_price: (vehicle as any).promotion_price,
    promotion_label: (vehicle as any).promotion_label,
    promotion_until: (vehicle as any).promotion_until,
    price: vehicle.price,
  });

  const goTo = (dir: -1 | 1, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + dir + allImages.length) % allImages.length);
  };

  return (
    <Link to={`/veiculo/${vehicle.id}`}>
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group bg-card rounded-lg overflow-hidden border border-border hover:border-primary/40 transition-all duration-300 cursor-pointer"
    >
      <div className="relative overflow-hidden aspect-[3/4]">
        <img
          src={allImages[currentIndex]}
          alt={`${vehicle.brand} ${vehicle.model}`}
          loading="lazy"
          width={900}
          height={1200}
          style={{ objectPosition: objectPositionFor((vehicle as any).image_position) }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {hasMultiple && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {allImages.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentIndex ? "bg-primary" : "bg-foreground/40"
                }`}
              />
            ))}
          </div>
        )}

        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {vehicle.highlights.map((h) => (
            <span
              key={h}
              className="px-2 py-0.5 bg-primary/90 text-primary-foreground text-[10px] font-display font-bold tracking-wider rounded-sm uppercase"
            >
              {h}
            </span>
          ))}
        </div>

        {promo.active && (
          <div className="absolute top-3 right-3">
            <PromoBadge label={promo.label} size="sm" />
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="font-display text-xs text-primary font-bold tracking-wider uppercase">
          {vehicle.brand}
        </p>
        <h3 className="font-display font-bold text-foreground text-base mt-0.5 leading-tight">
          {vehicle.display_name || `${vehicle.model} ${vehicle.version}`}
        </h3>

        <div className="flex items-center gap-4 mt-3 text-muted-foreground text-xs">
          <span className="flex items-center gap-1">
            <Gauge size={14} />
            {vehicle.km.toLocaleString("pt-BR")} km
          </span>
          <span className="flex items-center gap-1">
            <Fuel size={14} />
            {vehicle.fuel}
          </span>
          <span className="flex items-center gap-1">
            <Settings2 size={14} />
            {vehicle.transmission}
          </span>
        </div>

        <div className="flex items-end justify-between mt-4 pt-3 border-t border-border gap-2">
          {promo.active ? (
            <div className="flex flex-col leading-tight">
              <span className="text-xs text-muted-foreground line-through">
                De {formattedPrice}
              </span>
              <span className="font-display font-black text-lg text-red-500">
                {formatBRL(promo.promoPrice)}
              </span>
            </div>
          ) : (
            <span className="font-display font-black text-lg text-foreground">
              {formattedPrice}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{vehicle.year}</span>
        </div>
      </div>
    </motion.div>
    </Link>
  );
};

export default VehicleCard;
