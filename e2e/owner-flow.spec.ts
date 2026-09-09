import { expect, test } from "@playwright/test";
import { loginOwner, stubPrint } from "./helper";

test.describe("Area pemilik (backoffice) dengan data dummy", () => {
  test.beforeEach(async ({ page }) => {
    await stubPrint(page);
    await loginOwner(page);
  });

  test("dasbor menampilkan KPI Toko Berkah Jaya", async ({ page }) => {
    await expect(page.getByText("Omset Hari Ini")).toBeVisible();
    await expect(page.getByText("Keuntungan Kotor")).toBeVisible();
    await expect(page.getByText("Kasbon Belum Lunas")).toBeVisible();
    await expect(page.getByText("Perlu Kulakan").first()).toBeVisible();
    await expect(page.getByText("Minyak Goreng 1L").first()).toBeVisible();
    await expect(page.getByText("Tren Penjualan 7 Hari")).toBeVisible();
  });

  test("tambah produk kilat 3 kolom wajib", async ({ page }) => {
    await page.goto("/dashboard/produk");
    await page.getByRole("button", { name: /Tambah Produk/ }).click();
    await page.getByLabel(/Nama Barang/).fill("Kerupuk Udang Bundar");
    await page.getByLabel(/Harga Jual/).fill("5000");
    await page.getByLabel(/Jumlah Stok/).fill("30");
    await page.getByRole("button", { name: "Simpan Produk" }).click();
    await expect(page.getByRole("cell", { name: "Kerupuk Udang Bundar" }).first()).toBeVisible();
    // SKU otomatis tampil di baris produk
    await expect(page.getByText("KER-").first()).toBeVisible();
  });

  test("buku kasbon: terima pembayaran memperhitungkan sisa", async ({ page }) => {
    await page.goto("/dashboard/kasbon");
    const kartuBuAni = page.locator("div", { hasText: /^.*$/ }).filter({ hasText: "Bu Ani" });
    await expect(page.getByText("Bu Ani").first()).toBeVisible();
    await page.getByRole("button", { name: /Terima Pembayaran/ }).first().click();
    await page.getByRole("button", { name: /Lunas Semua/ }).click();
    await page.getByRole("button", { name: "Simpan Pembayaran" }).click();
    await expect(page.getByText(/LUNAS/)).toBeVisible();
    void kartuBuAni;
  });

  test("void transaksi butuh PIN pemilik", async ({ page }) => {
    await page.goto("/dashboard/transaksi");
    const baris = page.locator("tbody tr").first();
    await baris.getByRole("button", { name: /Batalkan/ }).click();
    await page.getByLabel(/PIN Pemilik Toko/).fill("0000");
    await page.getByRole("button", { name: /Ya, Batalkan Transaksi/ }).click();
    await expect(page.getByText(/PIN pemilik salah/)).toBeVisible();
    await page.getByLabel(/PIN Pemilik Toko/).fill("8765");
    await page.getByRole("button", { name: /Ya, Batalkan Transaksi/ }).click();
    await expect(page.getByText(/berhasil dibatalkan/)).toBeVisible();
  });

  test("laporan keuangan & tombol export", async ({ page }) => {
    await page.goto("/dashboard/laporan");
    await expect(page.getByText("Laba Kotor", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Arus Kas Toko")).toBeVisible();
    await page.getByRole("button", { name: /Export Excel/ }).click();
    await expect(page.getByText(/Menyiapkan unduhan laporan XLSX/)).toBeVisible();
  });

  test("pengaturan: akun kasir & konfigurasi Hermes", async ({ page }) => {
    await page.goto("/dashboard/pengaturan");
    await page.getByRole("tab", { name: /Kasir/ }).click();
    await expect(page.getByText("Siti Rahma")).toBeVisible();
    await page.getByRole("tab", { name: /Hermes AI/ }).click();
    await expect(page.getByText(/Hermes Agent \(Nous Research\)/)).toBeVisible();
  });

  test("widget Hermes menjawab cek stok menipis", async ({ page }) => {
    await page.getByRole("button", { name: "Buka chat Asisten AI Hermes" }).click();
    await page.getByRole("button", { name: "Barang apa yang mau habis?" }).click();
    await expect(page.getByText(/perlu segera dibeli|Semua stok aman/)).toBeVisible();
    await expect(page.getByText("get_low_stock_products()")).toBeVisible();
  });
});
