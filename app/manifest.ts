import type { MetadataRoute } from "next";
import { STORE_CONFIG } from "@/lib/storeConfig";

/**
 * Web app manifest for PWA install (Add to Home Screen).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: STORE_CONFIG.storeName,
    short_name: STORE_CONFIG.appShortName,
    description:
      "Billing, inventory, and customer management for your adventure gear store.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f5f5f4",
    theme_color: STORE_CONFIG.themeColor,
    orientation: "portrait-primary",
    categories: ["business", "finance"],
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/store-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
