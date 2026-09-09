import type { Metadata } from "next";
import { FormRegister } from "@/components/auth/form-register";

export const metadata: Metadata = {
  title: "Daftar Toko",
  description:
    "Daftarkan toko Anda di KasToko — aktif langsung dengan masa uji coba gratis 14 hari.",
  openGraph: {
    title: "Daftar Toko Baru — KasToko",
    description: "3 menit langsung bisa jualan. Tanpa perlu belajar berhari-hari.",
  },
};

export default function HalamanRegister() {
  return <FormRegister />;
}
