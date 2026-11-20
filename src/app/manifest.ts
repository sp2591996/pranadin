import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/** Web app manifest (icons from DS-6). PWA install prompt and offline are P1 (FR-12, E-12). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PranaDin",
    short_name: "PranaDin",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FFF4E0",
    theme_color: "#FFF4E0",
    lang: "en",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/monochrome-512.png", sizes: "512x512", type: "image/png", purpose: "monochrome" },
    ],
  };
}
