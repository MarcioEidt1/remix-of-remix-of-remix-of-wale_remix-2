import { IMAGE_POSITIONS, ImagePosition, objectPositionFor } from "@/lib/imagePosition";
import { cn } from "@/lib/utils";

interface ImagePositionSelectorProps {
  value?: string | null;
  onChange: (pos: ImagePosition) => void;
  previewSrc?: string;
  label?: string;
  hint?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Mostra um preview 3:4 + botões de recorte (centro/topo/base/esquerda/direita)
 * para garantir que o admin veja como a foto ficará antes de salvar.
 */
const ImagePositionSelector = ({
  value,
  onChange,
  previewSrc,
  label = "Recorte 3:4",
  hint = "Escolha qual área do carro deve ficar centralizada no formato 3:4.",
  compact,
  className,
}: ImagePositionSelectorProps) => {
  const current = (value as ImagePosition) || "center";
  const objectPosition = objectPositionFor(current);

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-xs text-muted-foreground font-medium block">{label}</label>}
      {hint && !compact && <p className="text-[11px] text-muted-foreground/70">{hint}</p>}

      <div className={cn("flex gap-3", compact ? "items-start" : "items-start flex-wrap")}>
        {previewSrc && (
          <div
            className={cn(
              "relative shrink-0 border border-border rounded-md overflow-hidden bg-secondary",
              compact ? "w-16 aspect-[3/4]" : "w-28 aspect-[3/4]"
            )}
            title="Pré-visualização 3:4"
          >
            <img
              src={previewSrc}
              alt="Pré-visualização do recorte"
              style={{ objectPosition }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-primary/30 pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 bg-background/80 text-[9px] text-center py-0.5 font-medium uppercase tracking-wider">
              3:4
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {IMAGE_POSITIONS.map((pos) => {
            const active = pos.value === current;
            return (
              <button
                key={pos.value}
                type="button"
                onClick={() => onChange(pos.value)}
                title={pos.hint}
                className={cn(
                  "px-2.5 py-1 text-[11px] rounded-sm border transition-colors font-medium",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                )}
              >
                {pos.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ImagePositionSelector;
