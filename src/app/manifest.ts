import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Toko Vape Online`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f4f7fa",
    theme_color: "#0a3d5c",
    lang: "id",
    icons: [
      {
        src: "/brand/IMG_3820.PNG",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/IMG_3820.PNG",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
