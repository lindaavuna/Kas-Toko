import { Pool, type PoolClient } from "pg";

// Kolom numeric/uuid/timestamptz dinormalkan supaya komponen tidak perlu
// casting manual (numeric balik sebagai string dari driver pg).
function normalisasiBaris(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  for (const baris of rows) {
    for (const k of Object.keys(baris)) {
      const v = baris[k];
      if (typeof v === "string" && !["barcode","phone","pin","cashier_pin","sku","receipt_number","transfer_ref"].includes(k) && /^\d+(\.\d+)?$/.test(v)) baris[k] = Number(v);
    }
  }
  return rows;
}

let poolApp: Pool | null = null;
export function pool() {
  if (!poolApp) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL kosong — salin dari .env.example ke .env.local");
    poolApp = new Pool({ connectionString: url, max: 8, idleTimeoutMillis: 30_000 });
  }
  return poolApp;
}

/** Query biasa tanpa identitas (login/bootstrap). RLS menolak tabel sensitif. */
export async function tanya<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
  const r = await pool().query(sql, params);
  return normalisasiBaris(r.rows as Record<string, unknown>[]) as unknown as T[];
}

/**
 * Semua query bisnis lewat sini: identitas user disuntik ke sesi PostgreSQL
 * lewat SET LOCAL, lalu RLS membatasi baris per store_id. Transaksi atomik
 * (createSale, closeShift) memakai denganTransaksi supaya stok, kas, dan
 * mutasi ikut gagal-bersama bila salah satu langkah error.
 */
export async function denganKlien<T>(
  userId: string,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("begin");
    await client.query("select set_config('app.user_id', $1, true)", [userId]);
    const hasil = await fn(client);
    await client.query("commit");
    return hasil;
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

export async function tanyaPakaiSesi<T = Record<string, unknown>>(
  userId: string,
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  return denganKlien(userId, async (client) => {
    const r = await client.query(sql, params);
    return normalisasiBaris(r.rows as Record<string, unknown>[]) as unknown as T[];
  });
}
