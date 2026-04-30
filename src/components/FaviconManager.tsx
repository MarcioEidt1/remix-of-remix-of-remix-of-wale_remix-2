import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const getMimeType = (url: string): string => {
  const u = url.toLowerCase().split("?")[0];
  if (u.endsWith(".svg")) return "image/svg+xml";
  if (u.endsWith(".png")) return "image/png";
  if (u.endsWith(".webp")) return "image/webp";
  if (u.endsWith(".jpg") || u.endsWith(".jpeg")) return "image/jpeg";
  if (u.endsWith(".ico")) return "image/x-icon";
  return "image/png";
};

const FaviconManager = () => {
  const { data: settings } = useSiteSettings();
  const faviconUrl = settings?.favicon_url;

  useEffect(() => {
    if (!faviconUrl) return;

    document
      .querySelectorAll("link[rel~='icon'], link[rel='shortcut icon']")
      .forEach((el) => el.parentNode?.removeChild(el));

    const link = document.createElement("link");
    link.rel = "icon";
    link.type = getMimeType(faviconUrl);
    link.href = faviconUrl;
    document.head.appendChild(link);
  }, [faviconUrl]);

  return null;
};

export default FaviconManager;
