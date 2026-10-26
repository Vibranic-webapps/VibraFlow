import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

// Served at /manifest.webmanifest. Makes VibraFlow installable and full screen on a phone.
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: BRAND.name,
        short_name: BRAND.name,
        description: "A cozy paper planner for tasks, calendar and goals.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: BRAND.paper,
        theme_color: BRAND.paperGrain,
        icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
    };
}
