import { NextResponse } from "next/server";
import { ambilKonteks } from "@/lib/server/sesi";
import {
  statistikDasbor,
  ambilProduk,
  ambilKasbon,
} from "@/lib/server/data";
import { catatPengeluaran } from "@/lib/server/bisnis";
import { formatRupiah } from "@/lib/format";

export const HERMES_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_daily_sales",
      description: "Menghitung omset penjualan dan estimasi laba hari ini.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_low_stock_products",
      description: "Daftar barang yang stoknya menipis di bawah batas minimum.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_debtor_list",
      description: "Daftar pembeli yang memiliki kasbon belum lunas.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_expense",
      description: "Mencatat pengeluaran kasir langsung dari percakapan chat.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Keperluan pengeluaran" },
          amount: { type: "number", description: "Nominal uang pengeluaran" },
        },
        required: ["title", "amount"],
      },
    },
  },
];

export async function POST(req: Request) {
  const ctx = await ambilKonteks();
  if (!ctx) {
    return NextResponse.json({ error: "Sesi tidak valid atau telah berakhir." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const pesanList: { role: string; content: string }[] = body.messages || [];
    const pesanTerakhir = pesanList[pesanList.length - 1]?.content || "";
    const q = pesanTerakhir.toLowerCase();

    // 1. Eksekutor Tool Internal Terintegrasi Database PostgreSQL
    async function eksekusiTool(namaTool: string, args: Record<string, unknown> = {}) {
      switch (namaTool) {
        case "get_daily_sales":
        case "ambil_omset_harian": {
          const stats = await statistikDasbor(ctx!);
          return {
            omsetHari: stats.omsetHari,
            labaHari: stats.labaHari,
            pesan: `Omset hari ini tercatat ${formatRupiah(stats.omsetHari)}. Estimasi laba kotor: ${formatRupiah(stats.labaHari)}. 🔥`,
          };
        }
        case "get_low_stock_products":
        case "ambil_produk_menipis": {
          const products = await ambilProduk(ctx!);
          const tipis = products.filter((p) => p.isActive && p.stockQty <= p.minStock);
          return {
            total: tipis.length,
            produk: tipis.map((p) => ({ nama: p.name, sisa: p.stockQty, batasMin: p.minStock })),
            pesan:
              tipis.length === 0
                ? "Semua stok aman, belum ada yang menipis. Siap-siap kulakan sebelum akhir pekan ya!"
                : `Barang yang perlu segera dibeli:\n` +
                  tipis.map((p) => `• ${p.name} — sisa ${p.stockQty} (minimum ${p.minStock})`).join("\n"),
          };
        }
        case "get_debtor_list":
        case "ambil_daftar_kasbon": {
          if (ctx!.peran !== "owner") {
            return {
              error: "Akses terbatas",
              pesan: "Buku kasbon penuh hanya untuk Pemilik Toko. Kalau ada pelanggan bayar cicilan, catat lewat Loket Kasbon ya.",
            };
          }
          const kasbonList = await ambilKasbon(ctx!);
          const aktif = kasbonList.filter((k) => k.status !== "paid");
          const totalKasbon = aktif.reduce((sum, k) => sum + (k.originalAmount - k.paidAmount), 0);
          return {
            totalPelanggan: aktif.length,
            totalNominal: totalKasbon,
            daftar: aktif.map((k) => ({
              nama: k.customerName,
              sisa: k.originalAmount - k.paidAmount,
            })),
            pesan:
              aktif.length === 0
                ? "Wah, tidak ada pelanggan yang punya kasbon. Semua sudah lunas!"
                : `Yang masih punya kasbon:\n` +
                  aktif.map((k) => `• ${k.customerName} — sisa ${formatRupiah(k.originalAmount - k.paidAmount)}`).join("\n") +
                  `\n\nTotal piutang: ${formatRupiah(totalKasbon)}`,
          };
        }
        case "create_expense":
        case "catat_pengeluaran_toko": {
          const judul = String(args.title || args.judul || "Pengeluaran kasir").slice(0, 50);
          const nominal = Number(args.amount || args.nominal || 0);
          if (nominal <= 0) {
            return { error: "Nominal harus lebih dari 0", pesan: "Nominal pengeluaran tidak valid." };
          }
          await catatPengeluaran(ctx!, {
            title: judul,
            amount: nominal,
            note: "Dicatat melalui Asisten AI Hermes",
          });
          return {
            sukses: true,
            judul,
            nominal,
            pesan: `Siap! Pengeluaran "${judul}" ${formatRupiah(nominal)} sudah dicatat dan memotong kas laci shift berjalan. ✔`,
          };
        }
        default:
          return { error: "Tool tidak dikenal" };
      }
    }

    // 2. Jika konfigurasi LLM Hermes API Key tersedia, hubungi provider
    const apiKey = process.env.HERMES_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    const baseUrl = process.env.HERMES_API_BASE_URL || "https://openrouter.ai/api/v1";

    if (apiKey) {
      try {
        const responseLlm = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: process.env.HERMES_MODEL || "nousresearch/hermes-3-llama-3.1-8b",
            messages: [
              {
                role: "system",
                content:
                  "Anda adalah Hermes, asisten toko pintar untuk UMKM ritel di aplikasi KasToko. Gunakan bahasa Indonesia yang ramah, sopan, dan ringkas. Gunakan function calling yang tersedia untuk menjawab data toko aktual.",
              },
              ...pesanList,
            ],
            tools: HERMES_TOOLS,
            tool_choice: "auto",
          }),
        });

        if (responseLlm.ok) {
          const dataLlm = await responseLlm.json();
          const choice = dataLlm.choices?.[0]?.message;

          if (choice?.tool_calls?.length > 0) {
            const toolCall = choice.tool_calls[0];
            const funcName = toolCall.function.name;
            let funcArgs = {};
            try {
              funcArgs = JSON.parse(toolCall.function.arguments || "{}");
            } catch {
              funcArgs = {};
            }

            const toolResult = await eksekusiTool(funcName, funcArgs);
            return NextResponse.json({
              role: "assistant",
              content: toolResult.pesan || JSON.stringify(toolResult),
              functionCalled: `${funcName}()`,
            });
          }

          if (choice?.content) {
            return NextResponse.json({
              role: "assistant",
              content: choice.content,
            });
          }
        }
      } catch (llmErr) {
        console.warn("Gagal menghubungi LLM eksternal, fallback ke engine lokal:", llmErr);
      }
    }

    // 3. Smart Engine Lokal (Zero-dependency Fallback)
    if (/(omset|penjualan|pemasukan|laba|untung)/.test(q)) {
      const res = await eksekusiTool("get_daily_sales");
      return NextResponse.json({
        role: "assistant",
        content: res.pesan,
        functionCalled: "get_daily_sales()",
      });
    }

    if (/(stok|habis|menipis|tipis|kulakan|restok|mau habis)/.test(q)) {
      const res = await eksekusiTool("get_low_stock_products");
      return NextResponse.json({
        role: "assistant",
        content: res.pesan,
        functionCalled: "get_low_stock_products()",
      });
    }

    if (/(kasbon|hutang|piutang|belum.?lunas)/.test(q)) {
      const res = await eksekusiTool("get_debtor_list");
      return NextResponse.json({
        role: "assistant",
        content: res.pesan,
        functionCalled: "get_debtor_list()",
      });
    }

    if (/(catat|beli|keluar|pengeluaran|bayar)/.test(q) && /(bensin|listrik|token|air|sampah|konsumsi|makan|plastik)/.test(q)) {
      const cocokNominal = pesanTerakhir.match(/(\d{1,3}(?:[.,]\d{3})+|\d+)\s*(ribu|rb|k)?/i);
      let nominal = 0;
      if (cocokNominal) {
        nominal = Number(cocokNominal[1].replace(/[.,]/g, ""));
        if (cocokNominal[2]) nominal *= 1000;
      }

      if (!nominal) {
        return NextResponse.json({
          role: "assistant",
          content: 'Boleh, sebutkan nominalnya. Contoh: "Tolong catat beli bensin Rp 20.000 dari kasir".',
          functionCalled: "create_expense()",
        });
      }

      const judul =
        pesanTerakhir
          .replace(/tolong|cat(at|kan)?|dari kas(ir)?|rp/gi, " ")
          .replace(/\d|[.,]/g, "")
          .trim()
          .slice(0, 40) || "Pengeluaran kasir";

      const res = await eksekusiTool("create_expense", { title: judul, amount: nominal });
      return NextResponse.json({
        role: "assistant",
        content: res.pesan,
        functionCalled: "create_expense()",
      });
    }

    // Jawaban umum
    return NextResponse.json({
      role: "assistant",
      content:
        'Contoh yang bisa ditanyakan:\n• "Omset hari ini berapa?"\n• "Barang apa yang stoknya mau habis?"\n• "Siapa saja yang punya kasbon?"\n• "Catat beli bensin Rp 20.000"',
    });
  } catch (err: unknown) {
    const pesan = err instanceof Error ? err.message : "Terjadi kesalahan internal AI.";
    return NextResponse.json({ error: pesan }, { status: 500 });
  }
}
