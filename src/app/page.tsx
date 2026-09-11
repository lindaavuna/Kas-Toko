import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ambilKonteks } from "@/lib/server/sesi";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingHero } from "@/components/landing/hero-section";
import { LandingValueStrip } from "@/components/landing/value-strip";
import { LandingFeatures } from "@/components/landing/features-section";
import { LandingPricing } from "@/components/landing/pricing-section";
import { LandingFAQ } from "@/components/landing/faq-section";
import { LandingFooter } from "@/components/landing/footer";
import { WhatsAppWidget } from "@/components/landing/whatsapp-widget";

export const metadata: Metadata = {
  title: "KasToko — Aplikasi POS Kasir Ritel & Warung Modern (100% Offline-First)",
  description:
    "Aplikasi kasir dan inventaris toko ritel berbasis cloud dengan mode 100% offline-first. Cetak struk Bluetooth thermal, buku kasbon WhatsApp, alarm stok menipis, dan asisten AI bisnis aman.",
  openGraph: {
    title: "KasToko — POS Kasir Ritel & Warung Modern",
    description: "Kasir cepat, stok rapi, dan laba tercatat otomatis. Coba gratis 7 hari tanpa kartu kredit!",
  },
};

export default async function HalamanAwal() {
  const ctx = await ambilKonteks();

  // Jika pengguna sudah login, arahkan langsung ke halaman operasionalnya
  if (ctx) {
    if (ctx.isSuperadmin) {
      redirect("/superadmin");
    }
    redirect(ctx.peran === "owner" ? "/dashboard" : "/kasir");
  }

  // Jika calon pelanggan / pengunjung umum, tampilkan Landing Page publik modern
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 flex flex-col selection:bg-emerald-500 selection:text-white">
      <LandingNavbar />
      <LandingHero />
      <LandingValueStrip />
      <LandingFeatures />
      <LandingPricing />
      <LandingFAQ />
      <LandingFooter />
      <WhatsAppWidget />
    </main>
  );
}
