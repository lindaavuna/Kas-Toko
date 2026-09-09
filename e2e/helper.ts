import { expect, type Page } from "@playwright/test";

export async function loginKasir(page: Page) {
  await page.goto("/login");
  await page.getByRole("tab", { name: /Kasir/ }).click();
  await page.getByLabel("Email Toko").fill("siti@tokoberkah.id");
  await page.getByLabel(/PIN Kasir/i).fill("1234");
  await page.getByRole("button", { name: /Masuk Cepat/i }).click();
  await expect(page).toHaveURL(/\/kasir/);
}

export async function loginOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("budi@tokoberkah.id");
  await page.getByLabel("Password", { exact: true }).fill("rahasia");
  await page.getByRole("button", { name: /Masuk sebagai Pemilik/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

/** Prevent real popup/print dialogs during shift close */
export async function stubPrint(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { open: () => null }).open = () => null;
    window.print = () => {};
  });
}

export async function bukaKasir(page: Page) {
  await expect(
    page.getByRole("heading", { name: /Buka Kasir/i })
  ).toBeVisible();
  await page.getByRole("button", { name: /Mulai Jualan/i }).click();
  await expect(page.getByRole("button", { name: "Tutup Kasir" })).toBeVisible();
}

export async function pastikanTanpaScrollHorizontal(page: Page, lebarMaks: number) {
  await page.waitForTimeout(250);
  const lebar = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(lebar).toBeLessThanOrEqual(lebarMaks + 2);
}
