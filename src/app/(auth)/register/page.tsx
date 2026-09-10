import type { Metadata } from "next";
import { Suspense } from "react";
import { FormRegister } from "@/components/auth/form-register";

export const metadata: Metadata = {
  title: "Daftar Toko Baru — KasToko",
  description:
    "Daftarkan toko Anda di KasToko — aktif langsung dengan masa uji coba gratis 7 hari.",
  openGraph: {
    title: "Daftar Toko Baru — KasToko",
    description: "3 menit langsung bisa jualan. Tanpa perlu belajar berhari-hari.",
  },
};

export default function HalamanRegister() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat formulir pendaftaran...</div>}>
      <FormRegister />
    </Suspense>
  );
}
