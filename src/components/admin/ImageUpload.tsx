import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  bucket: string;
  value: string;
  onChange: (url: string) => void;
  onMultiple?: (urls: string[]) => void;
  multiple?: boolean;
  label?: string;
  hint?: string;
  className?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  /** When true, uploads the original file (SVG/PNG) without converting to WebP */
  preserveOriginal?: boolean;
  /** Custom accept string for file input (default: "image/*") */
  accept?: string;
  /**
   * When set (e.g. "3/4"), shows the existing image inside an aspect box and warns
   * during upload when the source image is wider than the target ratio (risk of cropping).
   */
  previewAspect?: string;
  /** object-position to apply on the preview (e.g. "center top"). */
  previewObjectPosition?: string;
}

const MAX_WIDTH_DEFAULT = 1920;
const MAX_HEIGHT_DEFAULT = 1080;
const QUALITY_DEFAULT = 0.82;

/** Converts, resizes & compresses an image file to WebP via Canvas */
const processImage = (
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<{ blob: Blob; originalSize: number }> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      // Scale down proportionally
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas não suportado"));
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Falha ao converter imagem"));
          resolve({ blob, originalSize: file.size });
        },
        "image/webp",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível carregar a imagem"));
    };
    img.src = url;
  });

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ImageUpload = ({
  bucket,
  value,
  onChange,
  onMultiple,
  multiple,
  label,
  hint,
  className,
  maxWidth = MAX_WIDTH_DEFAULT,
  maxHeight = MAX_HEIGHT_DEFAULT,
  quality = QUALITY_DEFAULT,
  preserveOriginal = false,
  accept = "image/*",
  previewAspect,
  previewObjectPosition,
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState({ done: 0, total: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadOriginalFile = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const uploadFile = async (file: File): Promise<string> => {
    if (preserveOriginal) {
      return uploadOriginalFile(file);
    }
    const { blob, originalSize } = await processImage(file, maxWidth, maxHeight, quality);
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      contentType: "image/webp",
    });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    const saved = originalSize - blob.size;
    if (saved > 0) {
      console.log(
        `[ImageUpload] ${file.name}: ${formatSize(originalSize)} → ${formatSize(blob.size)} (−${Math.round((saved / originalSize) * 100)}%)`
      );
    }

    return data.publicUrl;
  };

  const checkAspectWarning = (file: File): Promise<void> =>
    new Promise((resolve) => {
      if (!previewAspect) return resolve();
      const [w, h] = previewAspect.split("/").map(Number);
      if (!w || !h) return resolve();
      const targetRatio = w / h;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const ratio = img.width / img.height;
        // Mais que 25% mais larga que o alvo → corte significativo
        if (ratio > targetRatio * 1.25) {
          toast.warning(
            `"${file.name}" é muito horizontal para ${previewAspect.replace("/", ":")}. Ajuste o recorte após o upload.`
          );
        }
        resolve();
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      img.src = url;
    });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.target.value = "";

    setUploading(true);
    setUploadCount({ done: 0, total: files.length });

    try {
      if (multiple && onMultiple && files.length > 1) {
        const urls: string[] = [];
        for (let i = 0; i < files.length; i++) {
          await checkAspectWarning(files[i]);
          const url = await uploadFile(files[i]);
          urls.push(url);
          setUploadCount((prev) => ({ ...prev, done: prev.done + 1 }));
        }
        onMultiple(urls);
        toast.success(`${urls.length} imagens enviadas em WebP!`);
      } else {
        await checkAspectWarning(files[0]);
        const url = await uploadFile(files[0]);
        onChange(url);
        toast.success("Imagem convertida para WebP e enviada!");
      }
    } catch (err: any) {
      toast.error("Erro ao enviar imagem: " + (err.message || ""));
    } finally {
      setUploading(false);
      setUploadCount({ done: 0, total: 0 });
    }
  };

  return (
    <div className={className}>
      {label && <label className="text-xs text-muted-foreground font-medium mb-1 block">{label}</label>}
      {hint && <p className="text-[11px] text-muted-foreground/70 mb-1.5">{hint}</p>}
      <div className="flex gap-2 items-start">
        {value ? (
          <div className="relative group/img shrink-0">
            {previewAspect ? (
              <div
                className="w-20 border border-border rounded overflow-hidden bg-secondary"
                style={{ aspectRatio: previewAspect.replace("/", " / ") }}
              >
                <img
                  src={value}
                  alt=""
                  style={{ objectPosition: previewObjectPosition || "center center" }}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <img src={value} alt="" className="w-24 h-16 object-cover rounded border border-border" />
            )}
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute -top-1.5 -right-1.5 p-0.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ) : null}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 bg-secondary text-foreground border border-border rounded-sm text-sm hover:border-primary transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading
              ? uploadCount.total > 1
                ? `Enviando ${uploadCount.done}/${uploadCount.total}...`
                : "Convertendo e enviando..."
              : multiple
                ? "Enviar imagens"
                : "Enviar imagem"}
          </button>
          <span className="text-[10px] text-muted-foreground/60">
            {preserveOriginal ? "Upload direto sem compressão" : `Auto-convertido para WebP • max ${maxWidth}×${maxHeight}px`}
          </span>
        </div>
        <input ref={fileRef} type="file" accept={accept} multiple={multiple} onChange={handleFile} className="hidden" />
      </div>
    </div>
  );
};

export default ImageUpload;
