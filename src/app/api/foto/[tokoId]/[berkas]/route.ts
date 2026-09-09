import { NextResponse } from "next/server";
import { createReadStream, existsSync } from "node:fs";
import { join } from "node:path";
import { ambilKonteks } from "@/lib/server/sesi";

const TIPE: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/** Sajian foto produk: cuma anggota toko pemilik folder yang boleh mengambil */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tokoId: string; berkas: string }> }
) {
  const ctx = await ambilKonteks();
  if (!ctx) return NextResponse.json({ error: "tanpa sesi" }, { status: 401 });
  const { tokoId, berkas } = await params;
  if (tokoId !== ctx.storeId || !/^[a-f0-9-]+\.(jpg|jpeg|png|webp)$/.test(berkas)) {
    return NextResponse.json({ error: "tolak" }, { status: 404 });
  }
  const path = join(process.cwd(), "data", "uploads", tokoId, berkas);
  if (!existsSync(path)) return NextResponse.json({ error: "tidak ada" }, { status: 404 });

  const ext = berkas.slice(berkas.lastIndexOf("."));
  const stream = createReadStream(path);
  const web = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => controller.enqueue(chunk));
      stream.on("end", () => controller.close());
      stream.on("error", (e) => controller.error(e));
    },
    cancel() {
      stream.destroy();
    },
  });
  return new Response(web as unknown as BodyInit, {
    headers: {
      "content-type": TIPE[ext] ?? "application/octet-stream",
      "cache-control": "private, max-age=86400",
    },
  });
}
