import { NextResponse } from "next/server";
import { ambilKonteks } from "@/lib/server/sesi";
import {
  statistikDasbor,
  ambilProdukMenipis,
  ambilKasbon,
  ambilIdentitasToko,
} from "@/lib/server/data";
import { formatRupiah } from "@/lib/format";

export const HERMES_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_daily_sales",
      description: "Menghitung omset penjualan dan estimasi laba hari ini secara read-only.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_low_stock_products",
      description: "Daftar barang yang stoknya menipis di bawah batas minimum (read-only).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_debtor_list",
      description: "Daftar pembeli yang memiliki kasbon belum lunas (read-only khusus owner).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_expense",
      description: "Menyiapkan draf pengeluaran kasir (AI Read-Only: wajib izin konfirmasi manusia).",
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

    // 1. Eksekutor Tool Internal Read-Only Terintegrasi Database PostgreSQL
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
          const tipis = await ambilProdukMenipis(ctx!);
          return {
            total: tipis.length,
            produk: tipis,
            pesan:
              tipis.length === 0
                ? "Semua stok aman, belum ada yang menipis. Siap-siap kulakan sebelum akhir pekan ya!"
                : `Barang yang perlu segera dibeli:\n` +
                  tipis.map((p) => `• ${p.nama} — sisa ${p.sisa} (minimum ${p.batasMin})`).join("\n"),
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
          
          // STRICT READ-ONLY GUARD: AI dilarang memutasi langsung ke database
          return {
            butuhKonfirmasiManual: true,
            jenisAksi: "catat_pengeluaran",
            draf: {
              judul,
              nominal,
            },
            pesan: `⚠️ Keamanan Chat AI (Strict Read-Only Aktif):\nAI tidak diizinkan memotong kas secara otomatis demi mencegah salah catat. Draf disiapkan:\n• Keperluan: "${judul}"\n• Nominal: ${formatRupiah(nominal)}\n\nSilakan konfirmasikan melalui tombol setujui di bawah.`,
          };
        }
        default:
          return { error: "Tool tidak dikenal" };
      }
    }

    // 2. Cek apakah AI dinonaktifkan atau memiliki kunci kustom mandiri di database
    let customApiKey: string | undefined;
    let customBaseUrl: string | undefined;
    try {
      const identitas = await ambilIdentitasToko(ctx!);
      if (identitas && !identitas.aiAktif) {
        return NextResponse.json({
          role: "assistant",
          content: "Asisten AI Hermes dinonaktifkan oleh pemilik toko di menu Pengaturan.",
        });
      }
      if (identitas?.aiApiKey) customApiKey = identitas.aiApiKey;
      if (identitas?.aiBaseUrl) customBaseUrl = identitas.aiBaseUrl;
    } catch {
      // Fallback bila query identitas gagal
    }

    // Default ke server AI mandiri 172.22.22.6 jika belum disetel di env
    const apiKey =
      customApiKey ||
      process.env.HERMES_API_KEY ||
      process.env.AI_PROVIDER_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.OPENAI_API_KEY ||
      "freellmapi-05e7421e181b72e15c9ec7c61beb0eaaf60e5bcef425fd44";

    const baseUrl =
      customBaseUrl ||
      process.env.HERMES_API_BASE_URL ||
      process.env.AI_PROVIDER_BASE_URL ||
      "http://172.22.22.6:3001/v1";

    const modelName =
      process.env.HERMES_MODEL ||
      "openai/gpt-oss-120b";

    if (apiKey) {
      try {
        const responseLlm = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              {
                role: "system",
                content:
                  "Anda adalah Hermes, asisten toko pintar untuk UMKM ritel di aplikasi KasToko. Gunakan bahasa Indonesia yang ramah, sopan, dan ringkas. Anda beroperasi dalam mode STRICT READ-ONLY. Jangan pernah mencoba mengubah database langsung. Gunakan function calling yang tersedia untuk membaca data toko aktual.",
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
              drafAksi: toolResult.butuhKonfirmasiManual ? toolResult.draf : undefined,
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

    // 3. Smart Engine Lokal (Zero-dependency Read-Only Fallback)
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
          content: 'Boleh, sebutkan nominalnya. Contoh: "Tolong siapkan draf beli bensin Rp 20.000".',
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
        drafAksi: res.draf,
      });
    }

    // Jawaban umum
    return NextResponse.json({
      role: "assistant",
      content:
        'Halo! Saya Asisten AI Hermes (Mode Aman Read-Only). Contoh yang bisa ditanyakan:\n• "Omset hari ini berapa?"\n• "Barang apa yang stoknya mau habis?"\n• "Siapa saja yang punya kasbon?"\n• "Siapkan draf pengeluaran bensin Rp 20.000"',
    });
  } catch (err: unknown) {
    const pesan = err instanceof Error ? err.message : "Terjadi kesalahan internal AI.";
    return NextResponse.json({ error: pesan }, { status: 500 });
  }
}
