import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/** Web app manifest. Icons arrive with DS-6; PWA install is P1 (FR-12). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PranaDin",
    short_name: "PranaDin",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FBF7F0",
    theme_color: "#FBF7F0",
    lang: "en",
    icons: [],
  };
}
