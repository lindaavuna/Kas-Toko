"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSesiStore } from "@/lib/stores/sesi-store";
import type { Role, SessionUser } from "@/lib/types";

const kosongkan = () => {};

function useSudahHydrasi(): boolean {
  return useSyncExternalStore(
    useCallback(() => kosongkan, []),
    () => true,
    () => false
  );
}

interface Props {
  boleh: Role[];
  children: (user: SessionUser) => React.ReactNode;
}

/**
 * Gerbang sesi (data dummy Tahap 1):
 * - belum login -> arahkan ke /login
 * - peran tidak berhak -> arahkan ke area miliknya
 */
export function ButuhSesi({ boleh, children }: Props) {
  const router = useRouter();
  const user = useSesiStore((s) => s.user);
  const siap = useSudahHydrasi();
  const bolehStr = boleh.join(",");

  useEffect(() => {
    if (!siap || !user) return;
    if (!bolehStr.split(",").includes(user.role)) {
      router.replace(user.role === "owner" ? "/dashboard" : "/kasir");
    }
  }, [siap, user, bolehStr, router]);

  if (!siap) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Memuat" />
      </div>
    );
  }

  if (!user) {
    return <Pergikan target="/login" />;
  }
  if (!boleh.includes(user.role)) {
    return null; // redirect effect di atas yang menangani
  }
  return <>{children(user)}</>;
}

function Pergikan({ target }: { target: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(target);
  }, [router, target]);
  return null;
}
