import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KasToko — Kasir & Manajemen Toko Pintar UMKM",
    short_name: "KasToko",
    description:
      "Sistem kasir cepat, pencatatan otomatis, struk Bluetooth thermal, mode offline-first, dan asisten AI pintar ramah UMKM.",
    start_url: "/kasir",
    id: "/kasir",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    background_color: "#064e3b",
    theme_color: "#059669",
    orientation: "portrait-primary",
    scope: "/",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    categories: ["business", "finance", "productivity", "utilities"],
    shortcuts: [
      {
        name: "Buka Kasir",
        url: "/kasir",
        description: "Buka loket kasir penjualan",
      },
      {
        name: "Dasbor Toko",
        url: "/dashboard",
        description: "Buka laporan & statistik toko",
      },
      {
        name: "Buku Kasbon",
        url: "/dashboard/kasbon",
        description: "Buka pencatatan hutang pelanggan",
      },
    ],
  };
}
