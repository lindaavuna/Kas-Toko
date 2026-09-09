"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AKUN, AKUN_KASIR } from "@/lib/dummy-data";
import type { SessionUser } from "@/lib/types";

interface SesiState {
  user: SessionUser | null;
  loginPemilik: (email: string, password: string) => { ok: boolean; pesan: string };
  loginKasir: (email: string, pin: string) => { ok: boolean; pesan: string };
  daftarToko: (data: {
    namaPemilik: string;
    email: string;
    password: string;
    namaToko: string;
    alamat: string;
    telepon: string;
  }) => { ok: boolean; pesan: string };
  keluar: () => void;
}

export const useSesiStore = create<SesiState>()(
  persist(
    (set) => ({
      user: null,

      loginPemilik: (email, password) => {
        if (email.trim().toLowerCase() === AKUN.owner.email && password === AKUN.owner.password) {
          set({ user: AKUN.owner.user });
          return { ok: true, pesan: "Berhasil masuk sebagai pemilik toko" };
        }
        return { ok: false, pesan: "Email atau password salah. Coba lagi ya." };
      },

      loginKasir: (email, pin) => {
        const akun = AKUN_KASIR.find((a) => a.email === email.trim().toLowerCase());
        if (!akun) return { ok: false, pesan: "Email kasir tidak ditemukan di toko ini." };
        if (!akun.isActive) return { ok: false, pesan: "Akun kasir sedang tidak aktif." };
        if (akun.pin !== pin) return { ok: false, pesan: "PIN kasir salah. Silakan coba lagi." };
        set({
          user: {
            id: akun.id,
            name: akun.name,
            email: akun.email,
            role: "cashier",
            storeId: AKUN.owner.user.storeId,
            storeName: AKUN.owner.user.storeName,
          },
        });
        return { ok: true, pesan: `Halo ${akun.name}, selamat berjualan!` };
      },

      daftarToko: ({ namaPemilik, email }) => {
        set({
          user: {
            id: `user-${namaPemilik.toLowerCase().replace(/\s+/g, "-")}`,
            name: namaPemilik,
            email,
            role: "owner",
            storeId: AKUN.owner.user.storeId,
            storeName: "Toko Baru Saya",
          },
        });
        return { ok: true, pesan: "Toko berhasil didaftarkan!" };
      },

      keluar: () => set({ user: null }),
    }),
    { name: "kastoko-sesi" }
  )
);
