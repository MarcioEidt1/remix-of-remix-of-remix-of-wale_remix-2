import { objectPositionFor } from "@/lib/imagePosition";
import { cn } from "@/lib/utils";

interface VehicleImageProps {
  src: string;
  alt: string;
  /** Posição de recorte (center/top/bottom/left/right). */
  position?: string | null;
  /** Aspect ratio Tailwind (default 3/4). */
  aspect?: string;
  className?: string;
  imgClassName?: string;
  loading?: "lazy" | "eager";
  onClick?: (e: React.MouseEvent) => void;
  width?: number;
  height?: number;
  children?: React.ReactNode;
}

/**
 * Wrapper padrão para fotos de veículos.
 * Garante aspect 3:4 + object-cover + object-position configurável,
 * mantendo o foco do carro centralizado conforme escolha do admin.
 */
const VehicleImage = ({
  src,
  alt,
  position,
  aspect = "aspect-[3/4]",
  className,
  imgClassName,
  loading = "lazy",
  onClick,
  width,
  height,
  children,
}: VehicleImageProps) => {
  const objectPosition = objectPositionFor(position);
  return (
    <div className={cn("relative overflow-hidden", aspect, className)} onClick={onClick}>
      <img
        src={src}
        alt={alt}
        loading={loading}
        width={width}
        height={height}
        style={{ objectPosition }}
        className={cn("w-full h-full object-cover", imgClassName)}
      />
      {children}
    </div>
  );
};

export default VehicleImage;
