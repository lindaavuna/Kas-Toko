import { expect, test } from "@playwright/test";
import { loginKasir, loginOwner } from "./helper";

const HALAMAN_OWNER = [
  "/dashboard",
  "/dashboard/transaksi",
  "/dashboard/produk",
  "/dashboard/stok",
  "/dashboard/mutasi",
  "/dashboard/pembelian",
  "/dashboard/kasbon",
  "/dashboard/supplier",
  "/dashboard/laporan",
  "/dashboard/pengaturan",
];

async function tanpaScrollHorizontal(page: import("@playwright/test").Page, halaman: string) {
  const { sw, cw } = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sw, `Halaman ${halaman} overflow horizontal (${sw}px > ${cw}px)`).toBeLessThanOrEqual(cw + 2);
}

test.describe("Uji responsif (Task 1.20)", () => {
  test("semua halaman pemilik rapi di HP Android 360px", async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 360, height: 780 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await ctx.newPage();
    await loginOwner(page);
    await expect(page.locator("aside")).toBeHidden();
    for (const h of HALAMAN_OWNER) {
      await page.goto(h);
      await expect(page.locator("main").first()).toBeVisible();
      await tanpaScrollHorizontal(page, h);
    }
    // Drawer hamburger berfungsi di HP
    await page.getByRole("button", { name: "Buka menu" }).click();
    await expect(page.getByRole("link", { name: /Laporan Keuangan/ })).toBeVisible();
    await ctx.close();
  });

  test("POS kasir nyaman disentuh di HP 412px (keranjang via tombol melayang)", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      viewport: { width: 412, height: 915 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await ctx.newPage();
    await loginKasir(page);
    await expect(page.getByRole("heading", { name: /Buka Kasir/i })).toBeVisible();
    await page.getByRole("button", { name: /Mulai Jualan/i }).click();

    await page.getByRole("button", { name: "Telur Ayam 1Kg", exact: true }).click();
    await page.getByRole("button", { name: "Buka keranjang belanja" }).click();
    await expect(page.getByText("Rp 30.000").first()).toBeVisible();
    await tanpaScrollHorizontal(page, "/kasir");
    await ctx.close();
  });

  test("tampilan desktop: sidebar & panel keranjang permanen", async ({ page }) => {
    await loginOwner(page);
    await expect(page.locator("aside")).toBeVisible();
    await page.goto("/kasir");
    await expect(page.getByRole("button", { name: "Bayar", exact: true })).toBeVisible();
  });
});
