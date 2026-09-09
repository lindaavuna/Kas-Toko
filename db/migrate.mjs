import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "./env.mjs";
import { Pool } from "pg";

// Jalankan migrasi SQL berurutan memakai koneksi ADMIN (superuser kontainer).
// Peran aplikasi kastoko_app dibuat/dipatok passwordnya di sini, bukan di file SQL,
// supaya kredensial tidak pernah menumpang di repo.

const here = dirname(fileURLToPath(import.meta.url));
loadEnv();

const adminUrl = process.env.DATABASE_ADMIN_URL;
const appPassword = process.env.POSTGRES_APP_PASSWORD;
if (!adminUrl) throw new Error("DATABASE_ADMIN_URL belum ada di .env.local");
if (!appPassword) throw new Error("POSTGRES_APP_PASSWORD belum ada di .env.local");

const dbUrl = new URL(adminUrl);
const dbName = dbUrl.pathname.slice(1);

const admin = new Pool({ connectionString: adminUrl, max: 1 });
const client = await admin.connect();

try {
  await client.query(
    `do $$ begin
       if not exists (select from pg_roles where rolname = 'kastoko_app') then
         create role kastoko_app login;
       end if;
     end $$;`
  );
  // password role app diset tiap jalan ulang migrate — cukup hex lokal
  await client.query(`alter role kastoko_app with login password '${appPassword.replace(/'/g, "''")}'`);
  // tanggal penjualan/kas mengikuti jam warung (WIB), bukan UTC
  await client.query(`alter role kastoko_app set timezone to 'Asia/Jakarta'`);

  await client.query(`create table if not exists public.schema_migrations (
    filename text primary key, applied_at timestamptz not null default now())`);

  const sudah = new Set(
    (await client.query("select filename from public.schema_migrations")).rows.map((r) => r.filename)
  );

  const files = readdirSync(join(here, "migrations")).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    if (sudah.has(f)) {
      console.log(`lewati ${f} (sudah diterapkan)`);
      continue;
    }
    const sql = readFileSync(join(here, "migrations", f), "utf8");
    console.log(`menerapkan ${f} ...`);
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into public.schema_migrations (filename) values ($1)", [f]);
      await client.query("commit");
      console.log(`  ✔ ${f}`);
    } catch (e) {
      await client.query("rollback");
      throw new Error(`Gagal pada ${f}: ${e.message}`);
    }
  }
  console.log(`selesai. database: ${dbName}`);
} finally {
  client.release();
  await admin.end();
}
