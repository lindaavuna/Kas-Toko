import { describe, it, expect } from "vitest";
import { HERMES_TOOLS } from "../route";

describe("Asisten AI Hermes Function Calling Tools", () => {
  it("memiliki 4 definisi tools standar Hermes 3 sesuai PRD", () => {
    expect(HERMES_TOOLS.length).toBe(4);
    const namaTools = HERMES_TOOLS.map((t) => t.function.name);
    expect(namaTools).toContain("get_daily_sales");
    expect(namaTools).toContain("get_low_stock_products");
    expect(namaTools).toContain("get_debtor_list");
    expect(namaTools).toContain("create_expense");
  });

  it("tool create_expense memiliki skema parameter title dan amount wajib", () => {
    const toolPengeluaran = HERMES_TOOLS.find(
      (t) => t.function.name === "create_expense"
    );
    expect(toolPengeluaran).toBeDefined();
    expect(toolPengeluaran?.function.parameters.required).toContain("title");
    expect(toolPengeluaran?.function.parameters.required).toContain("amount");
  });
});
