import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "KasToko — Kasir & Manajemen Toko Pintar",
    template: "%s | KasToko",
  },
  description:
    "KasToko membantu pemilik toko mencatat pemasukan, pengeluaran, dan stok secara otomatis. Ramah UMKM, cepat, dan tetap jalan walau internet mati.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "KasToko — Kasir & Manajemen Toko Pintar Ramah UMKM",
    description:
      "Sistem kasir cepat + pembukuan otomatis untuk toko kelontong dan sembako. PWA, siap Android, mendukung 58mm/80mm thermal.",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KasToko",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
        <Toaster richColors position="top-center" closeButton />
      </body>
    </html>
  );
}
