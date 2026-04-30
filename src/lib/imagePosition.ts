// Posições de recorte permitidas para o formato 3:4 dos veículos.
export type ImagePosition = "center" | "top" | "bottom" | "left" | "right";

export const IMAGE_POSITIONS: { value: ImagePosition; label: string; hint: string }[] = [
  { value: "center", label: "Centro", hint: "Padrão — mantém o centro do carro" },
  { value: "top", label: "Topo", hint: "Mostra o teto/frente alta" },
  { value: "bottom", label: "Base", hint: "Prioriza rodas/parachoque" },
  { value: "left", label: "Esquerda", hint: "Recorta para a lateral esquerda" },
  { value: "right", label: "Direita", hint: "Recorta para a lateral direita" },
];

const CSS_MAP: Record<ImagePosition, string> = {
  center: "center center",
  top: "center top",
  bottom: "center bottom",
  left: "left center",
  right: "right center",
};

export function objectPositionFor(pos?: string | null, fallback: ImagePosition = "center"): string {
  const key = (pos as ImagePosition) || fallback;
  return CSS_MAP[key] || CSS_MAP[fallback] || "center center";
}

/** Resolve a posição final de uma imagem extra (override > padrão do veículo > center). */
export function resolveImagePosition(
  imagePos?: string | null,
  vehicleDefault?: string | null
): ImagePosition {
  return ((imagePos || vehicleDefault) as ImagePosition) || "center";
}
