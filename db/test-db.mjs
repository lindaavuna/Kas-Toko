import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "./env.mjs";
import { Pool } from "pg";

// Siapkan database TERISOLASI utk integration test: kastoko_test.
// Schema dibuang-ulang tiap jalan, jadi test tidak pernah menodai data demo.

const here = dirname(fileURLToPath(import.meta.url));
loadEnv();

const adminUrl = new URL(process.env.DATABASE_ADMIN_URL);
const dbName = "kastoko_test";

const root = new Pool({ connectionString: adminUrl.toString().replace(/\/[^/]*$/, "/postgres"), max: 1 });
const rc = await root.connect();
const ada = await rc.query("select 1 from pg_database where datname = $1", [dbName]);
if (ada.rows.length === 0) {
  await rc.query(`create database ${dbName}`);
  console.log(`database ${dbName} dibuat`);
}
rc.release();
await root.end();

const c = new Pool({ connectionString: adminUrl.toString().replace(/\/[^/]*$/, `/${dbName}`), max: 1 });
const cl = await c.connect();
try {
  await cl.query(`drop schema public cascade; create schema public; grant usage on schema public to kastoko_app;`);
  const files = readdirSync(join(here, "migrations")).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    if (!existsSync(join(here, "migrations", f))) continue;
    await cl.query(readFileSync(join(here, "migrations", f), "utf8"));
  }
  console.log(`schema ${dbName} dimigrasi ulang (${files.length} file)`);
} finally {
  cl.release();
  await c.end();
}
