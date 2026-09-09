import { redirect } from "next/navigation";
import { ambilKonteks } from "@/lib/server/sesi";

export default async function HalamanAwal() {
  const ctx = await ambilKonteks();
  if (!ctx) redirect("/login");
  redirect(ctx.peran === "owner" ? "/dashboard" : "/kasir");
}
