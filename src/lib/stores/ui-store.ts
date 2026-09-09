"use client";

import { create } from "zustand";
import type { Sale } from "@/lib/types";

type DialogShift = null | "buka" | "tutup";

interface UiState {
  dialogShift: DialogShift;
  bayarOpen: boolean;
  strukSale: Sale | null;
  keranjangSheetOpen: boolean;
  setDialogShift: (v: DialogShift) => void;
  setBayarOpen: (v: boolean) => void;
  setStrukSale: (v: Sale | null) => void;
  setKeranjangSheetOpen: (v: boolean) => void;
}

/** State dialog bersama antar komponen POS */
export const useUiStore = create<UiState>((set) => ({
  dialogShift: null,
  bayarOpen: false,
  strukSale: null,
  keranjangSheetOpen: false,
  setDialogShift: (v) => set({ dialogShift: v }),
  setBayarOpen: (v) => set({ bayarOpen: v }),
  setStrukSale: (v) => set({ strukSale: v }),
  setKeranjangSheetOpen: (v) => set({ keranjangSheetOpen: v }),
}));
