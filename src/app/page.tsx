"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useSesiStore } from "@/lib/stores/sesi-store";
import { Loader2, Store } from "lucide-react";

const kosong = () => {};

/** True hanya di sisi client setelah hydration (pola useSyncExternalStore) */
function useSudahHydrasi(): boolean {
  return useSyncExternalStore(
    useCallback(() => kosong, []),
    () => true,
    () => false
  );
}

export default function HalamanAwal() {
  const router = useRouter();
  const user = useSesiStore((s) => s.user);
  const siap = useSudahHydrasi();

  useEffect(() => {
    if (!siap) return;
    if (!user) router.replace("/login");
    else if (user.role === "owner") router.replace("/dashboard");
    else router.replace("/kasir");
  }, [siap, user, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
      {!siap && (
        <div className="flex items-center gap-2">
          <Store className="size-8 text-primary" />
          <span className="text-lg font-semibold text-foreground">KasToko</span>
        </div>
      )}
      <Loader2 className="size-6 animate-spin" aria-label="Memuat" />
    </div>
  );
}
