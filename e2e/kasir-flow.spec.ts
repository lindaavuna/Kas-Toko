import { expect, test } from "@playwright/test";
import { bukaKasir, loginKasir, stubPrint } from "./helper";

test.describe("Alur lengkap kasir (PRD Bab 6: 3 menit langsung bisa jualan)", () => {
  test("login ➜ buka kasir ➜ pilih produk ➜ uang pas ➜ struk ➜ riwayat ➜ tutup kasir", async ({
    page,
  }) => {
    await stubPrint(page);

    // Halaman awal mengarahkan ke login saat belum masuk
    await page.goto("/");
    await page.waitForURL(/\/login/);

    // 1) Login cepat kasir dengan PIN
    await loginKasir(page);

    // 2) Dialog buka kasir muncul otomatis; modal awal default Rp 150.000
    await bukaKasir(page);

    // 3) Pilih produk dari katalog sentuh: 2x Beras Premium 5Kg (Rp 124.000)
    const beras = page.getByRole("button", { name: "Beras Premium 5Kg", exact: true });
    await beras.click();
    await beras.click();
    await expect(page.getByText("Rp 124.000").first()).toBeVisible();

    // 4) Tekan Bayar ➜ panel uang instan ➜ Uang Pas
    await page.getByRole("button", { name: "Bayar", exact: true }).click();
    await expect(page.getByText("TOTAL TAGIHAN", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Uang Pas/ }).click();
    await expect(page.getByText("KEMBALIAN", { exact: true })).toBeVisible();
    await expect(page.getByText("Rp 0", { exact: true }).first()).toBeVisible();

    // 5) Selesai & cetak struk -> pratinjau struk thermal
    await page.getByRole("button", { name: /Selesai & Cetak Struk/ }).click();
    await expect(page.getByText(/Transaksi Berhasil/)).toBeVisible();
    await expect(page.locator("#struk-print")).toContainText("Beras Premium 5Kg");
    await expect(page.locator("#struk-print")).toContainText("Rp 124.000");

    // Toggle ukuran 80mm
    await page.getByRole("button", { name: "80mm" }).click();
    await page.getByRole("button", { name: "58mm" }).click();

    await page.getByRole("button", { name: "Selesai", exact: true }).click();

    // 6) Riwayat transaksi shift memuat struk baru + tombol cetak ulang
    await page.goto("/kasir/riwayat");
    await expect(page.getByRole("heading", { name: /Riwayat Transaksi Shift/ })).toBeVisible();
    await expect(page.getByText("Rp 124.000").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Struk" }).first()).toBeVisible();

    // 7) Tutup kasir: isi uang fisik sama dengan seharusnya -> Seimbang
    await page.getByRole("button", { name: "Tutup Kasir" }).click();
    await expect(page.getByText("Kas seharusnya")).toBeVisible();
    const seharusnya = await page.getByTestId("kas-seharusnya").innerText();
    const angka = Number(seharusnya.replace(/[^\d]/g, ""));
    await page.getByLabel("Uang Fisik di Laci").fill(String(angka));
    await expect(page.getByText("Uang Cocok (Seimbang)")).toBeVisible();
    await page.getByRole("button", { name: /Tutup & Cetak Z-Report/ }).click();

    // Shift tertutup -> header menampilkan tombol Buka Kasir lagi
    await expect(page.getByRole("button", { name: "Buka Kasir" })).toBeVisible();
  });

  test("belanja kasbon masuk ke buku kasbon loket kasir", async ({ page }) => {
    await stubPrint(page);
    await loginKasir(page);
    await bukaKasir(page);

    // 1x Gula Pasir (Rp 17.500) via pencarian instan
    await page.getByLabel("Cari produk").fill("gula");
    await page.getByRole("button", { name: "Gula Pasir 1Kg", exact: true }).click();
    await page.getByRole("button", { name: "Bayar", exact: true }).click();
    await page.getByRole("tab", { name: "Kasbon" }).click();
    await page.getByText("— Pilih nama pelanggan —").click();
    await page.getByRole("option", { name: /Bu Ani/ }).click();
    await page.getByRole("button", { name: /Selesai & Cetak Struk/ }).click();
    await expect(page.getByText(/Belanja dicatat sebagai kasbon pelanggan/)).toBeVisible();
    await page.getByRole("button", { name: "Selesai", exact: true }).click();

    // Cek di loket kasbon: Bu Ani bertambah kasbonnya
    await page.goto("/kasir/kasbon");
    await expect(page.getByText("Bu Ani")).toBeVisible();
    await expect(page.locator("text=/Kasbon Rp/").first()).toBeVisible();
  });
});
