"use client";

import { useEffect, useRef } from "react";

interface BarcodeListenerProps {
  onScan: (barcode: string) => void;
  disabled?: boolean;
}

/**
 * Listener global untuk scanner barcode tembak USB & Bluetooth HID.
 * Scanner mengirim rentetan keystroke dalam interval sangat singkat (< 50ms)
 * dan diakhiri dengan tombol 'Enter'.
 */
export function BarcodeListener({ onScan, disabled = false }: BarcodeListenerProps) {
  const bufferRef = useRef<string>("");
  const waktuKarakterTerakhir = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (disabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Jika kasir sedang mengetik di input form teks biasa (selain catcher barcode), abaikan
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        // Izinkan jika input memiliki penanda khusus catcher scanner
        const isCatcher = target.getAttribute("data-barcode-catcher") === "true";
        if (!isCatcher) {
          return;
        }
      }

      const sekarang = Date.now();
      const selisihWaktu = sekarang - waktuKarakterTerakhir.current;
      waktuKarakterTerakhir.current = sekarang;

      // Jika Enter ditekan: periksa apakah buffer berisi barcode scanner cepat
      if (e.key === "Enter") {
        const barcode = bufferRef.current.trim();
        if (barcode.length >= 3) {
          e.preventDefault();
          onScan(barcode);
        }
        bufferRef.current = "";
        if (timerRef.current) clearTimeout(timerRef.current);
        return;
      }

      // Hanya tangkap tombol karakter tunggal (hindari Alt, Shift, Control, F1-F12, dll.)
      if (e.key.length !== 1) {
        return;
      }

      // Jika jeda antar karakter lebih dari 75ms, anggap ketikan manual manusia biasa, reset buffer
      if (selisihWaktu > 75) {
        bufferRef.current = "";
      }

      bufferRef.current += e.key;

      // Bersihkan buffer otomatis jika tidak ada kelanjutan dalam 500ms
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        bufferRef.current = "";
      }, 500);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onScan, disabled]);

  return null;
}
