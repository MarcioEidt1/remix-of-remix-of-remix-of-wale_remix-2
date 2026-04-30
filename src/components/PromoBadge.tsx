import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromoBadgeProps {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const PromoBadge = ({ label = "OFERTA", className, size = "md" }: PromoBadgeProps) => {
  const sizes = {
    sm: "px-2.5 py-1 text-[10px] gap-1",
    md: "px-3 py-1.5 text-xs gap-1.5",
    lg: "px-4 py-2 text-sm gap-2",
  };
  const iconSize = size === "sm" ? 11 : size === "lg" ? 16 : 13;

  return (
    <div
      className={cn(
        "relative inline-flex items-center font-display font-black tracking-wider uppercase",
        "rounded-md text-white overflow-hidden",
        "bg-gradient-to-br from-red-600 via-red-500 to-rose-700",
        "animate-promo-pulse",
        sizes[size],
        className
      )}
      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
    >
      <Tag size={iconSize} className="relative z-10" fill="currentColor" />
      <span className="relative z-10">{label}</span>
      {/* shine sweep */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-promo-shine pointer-events-none"
      />
    </div>
  );
};

export default PromoBadge;
