import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const GoogleScripts = () => {
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    if (!settings) return;

    // Google Analytics 4
    if (settings.google_analytics_enabled === "true" && settings.google_analytics_id) {
      const gaId = settings.google_analytics_id;
      if (!document.getElementById("ga-script")) {
        const script = document.createElement("script");
        script.id = "ga-script";
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);

        const inline = document.createElement("script");
        inline.id = "ga-inline";
        inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`;
        document.head.appendChild(inline);
      }
    }

    // Google Tag Manager
    if (settings.google_tag_manager_enabled === "true" && settings.google_tag_manager_id) {
      const gtmId = settings.google_tag_manager_id;
      if (!document.getElementById("gtm-script")) {
        const script = document.createElement("script");
        script.id = "gtm-script";
        script.textContent = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`;
        document.head.appendChild(script);
      }
    }

    // Google Search Console verification
    if (settings.google_search_console_enabled === "true" && settings.google_search_console_id) {
      if (!document.getElementById("gsc-meta")) {
        const meta = document.createElement("meta");
        meta.id = "gsc-meta";
        meta.name = "google-site-verification";
        meta.content = settings.google_search_console_id;
        document.head.appendChild(meta);
      }
    }

    // Google Ads
    if (settings.google_ads_enabled === "true" && settings.google_ads_id) {
      const adsId = settings.google_ads_id;
      if (!document.getElementById("gads-script")) {
        const script = document.createElement("script");
        script.id = "gads-script";
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${adsId}`;
        document.head.appendChild(script);

        const inline = document.createElement("script");
        inline.id = "gads-inline";
        inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${adsId}');`;
        document.head.appendChild(inline);
      }
    }
  }, [settings]);

  return null;
};

export default GoogleScripts;
