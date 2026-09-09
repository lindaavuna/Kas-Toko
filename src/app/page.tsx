"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSesiStore } from "@/lib/stores/sesi-store";
import { ArrowRight, Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HalamanAwal() {
  const router = useRouter();
  const user = useSesiStore((s) => s.user);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    setSiap(true);
  }, []);

  useEffect(() => {
    if (!siap) return;
    if (!user) router.replace("/login");
    else if (user.role === "owner") router.replace("/dashboard");
    else router.replace("/kasir");
  }, [siap, user, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background text-muted-foreground p-4 text-center">
      <div className="flex items-center gap-2">
        <Store className="size-8 text-primary" />
        <span className="text-xl font-bold text-foreground">KasToko</span>
      </div>
      <p className="text-sm text-muted-foreground">Mengarahkan ke halaman masuk...</p>
      <Loader2 className="size-6 animate-spin text-primary mt-1" aria-label="Memuat" />

      {/* Tombol cadangan jika browser lambat mengarahkan otomatis */}
      <div className="pt-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/login" className="inline-flex items-center gap-2">
            Buka Halaman Login
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
