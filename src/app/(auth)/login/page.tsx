import type { Metadata } from "next";
import { FormLogin } from "@/components/auth/form-login";

export const metadata: Metadata = {
  title: "Masuk",
  description:
    "Masuk ke KasToko — pemilik toko dengan email & password, kasir dengan email toko & PIN 4 angka.",
  openGraph: {
    title: "Masuk ke KasToko",
    description: "Kasir cepat ramah UMKM, tetap jalan walau internet mati.",
  },
};

export default function HalamanLogin() {
  return <FormLogin />;
}
