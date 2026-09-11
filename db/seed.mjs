/* eslint-disable */
import { loadEnv } from "./env.mjs";
import { hashKredensial } from "./kredensial.mjs";
import { Pool } from "pg";

// Seed toko contoh "Toko Berkah Jaya" (PRD Bab 9): 15 produk sembako,
// supplier, kasbon Bu Ani, penjualan 7 hari untuk tren, shift kemarin tutup.
// Idempotent: DB sudah terisi -> berhenti; `--reset` -> bersihkan lalu isi ulang.

loadEnv();
const pool = new Pool({ connectionString: process.env.DATABASE_ADMIN_URL, max: 1 });
const c = await pool.connect();

const U = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const STORE = U(1);
const BUDI = U(2);
const SITI = U(3);
const RINA = U(4);
const CAT = { sembak: U(11), minum: U(12), dapur: U(13), lain: U(14) };
const PROD = [
  // sku, nama, barcode, beli, jual, stok, min, kategori, emoji, satuan
  ["BRS-0001", "Beras Premium 5Kg", "8991002111111", 55000, 62000, 40, 10, CAT.sembak, "🍚"],
  ["MNY-0001", "Minyak Goreng 1L", "8991002222222", 16500, 19000, 2, 5, CAT.sembak, "🛢️"],
  ["GLA-0001", "Gula Pasir 1Kg", "8991002333333", 15000, 17500, 25, 5, CAT.sembak, "🍬"],
  ["TEL-0001", "Telur Ayam 1Kg", "8991002444444", 26000, 30000, 8, 10, CAT.dapur, "🥚"],
  ["DIM-0001", "Indomie Goreng", "8991003111111", 2400, 3000, 200, 40, CAT.sembak, "🍜"],
  ["AIR-0001", "Air Mineral 600ml", "8991003222222", 2500, 3500, 96, 24, CAT.minum, "🥤"],
  ["SKM-0001", "Susu SKM 370gr", "8991003333333", 12000, 15000, 18, 6, CAT.minum, "🥫"],
  ["KOP-0001", "Kopi Sachet", "8991003444444", 1200, 2000, 120, 30, CAT.minum, "☕"],
  ["TEH-0001", "Teh Celup 25s", "8991003555555", 4500, 6500, 22, 8, CAT.minum, "🫖"],
  ["LPG-0001", "Gas LPG 3Kg", "8991003666666", 16000, 21000, 9, 5, CAT.dapur, "🔥"],
  ["SBN-0001", "Sabun Mandi 240ml", "8991003777777", 3000, 4500, 35, 10, CAT.lain, "🧼"],
  ["RKK-0001", "Rokok Garnet Mild (Packs)", "8991003888888", 20500, 23000, 40, 10, CAT.lain, "🚬"],
  ["KEC-0001", "Kecap Manis 550ml", "8991004222222", 11000, 14000, 20, 6, CAT.dapur, "🍯"],
  ["ROY-0001", "Bumbu Instan Royco 10s", "8991004333333", 8000, 10500, 15, 5, CAT.dapur, "🧂"],
  ["MGR-0001", "Margarin Blueband 200g", "8991004444444", 9500, 12500, 14, 5, CAT.dapur, "🧈"],
].map((p, i) => ({
  id: U(101 + i), sku: p[0], name: p[1], barcode: p[2],
  beli: p[3], jual: p[4], stok: p[5], min: p[6], cat: p[7], emoji: p[8],
}));

const bySku = Object.fromEntries(PROD.map((p) => [p.sku, p]));
const SUP = { sinar: U(201), makmur: U(202) };
const PEL = { ani: U(301), joko: U(302), lily: U(303) };

function waktuLalu(hari, jam, menit) {
  const d = new Date();
  d.setDate(d.getDate() - hari);
  d.setHours(jam, menit, 0, 0);
  return d;
}
const ppn = (n) => String(n).padStart(2, "0");
const nomorStruk = (tanggal, urut) =>
  `STR-${tanggal.getFullYear()}${ppn(tanggal.getMonth() + 1)}${ppn(tanggal.getDate())}-${ppn(urut)}`;

const q = (sql, params) => c.query(sql, params);

try {
  await q("begin");

  const sudahAda = await q("select 1 from stores where id = $1", [STORE]);
  const reset = process.argv.includes("--reset");
  if (sudahAda.rowCount > 0 && !reset) {
    await q("rollback");
    console.log("Toko contoh sudah ada — tidak seed ulang. Pakai: npm run db:seed -- --reset");
    process.exit(0);
  }
  if (reset) {
    console.log("mode --reset: membersihkan data lama...");
    for (const t of [
      "notifications", "cash_flows", "expenses", "receivable_payments", "receivables",
      "payable_payments", "payables", "purchase_items", "purchases", "sale_items", "sales",
      "stock_mutations", "duitku_payments", "product_units", "products", "suppliers",
      "customers", "categories", "cashier_shifts", "app_sessions", "store_members", "stores", "users",
    ]) {
      await q(`delete from ${t}`);
    }
  }

  // pengguna: password demo `rahasia`, PIN 1234/5678, PIN void pemilik 8765
  const hashPass = hashKredensial("rahasia");
  await q(
    `insert into users (id, full_name, email, password_hash, phone) values
     ($1,'Budi Santoso','budi@tokoberkah.id',$2,'0851-2345-6789'),
     ($3,'Siti Rahma','siti@tokoberkah.id',$4,'0812-9999-0000'),
     ($5,'Rina Wati','rina@tokoberkah.id',$6,null)`,
    [BUDI, hashPass, SITI, hashPass, RINA, hashPass]
  );
  await q(
    `insert into stores (id, name, address, phone, receipt_footer, subscription_status, subscription_expires_at)
     values ($1,'Toko Berkah Jaya','Jl. Melati No. 12, Surabaya','0851-2345-6789',
             'Terima kasih atas kunjungan Anda!','trial', now() + interval '14 days')`,
    [STORE]
  );
  await q(
    `insert into store_members (store_id, user_id, role, cashier_pin) values
     ($1,$2,'owner',$3), ($1,$4,'cashier',$5), ($1,$6,'cashier',$7)`,
    [STORE, BUDI, hashKredensial("8765"), SITI, hashKredensial("1234"), RINA, hashKredensial("5678")]
  );

  await q(
    `insert into categories (id, store_id, name) values
     ($1,$4,'Sembako'),($2,$4,'Minuman'),($3,$4,'Dapur'),($5,$4,'Perlengkapan')`,
    [CAT.sembak, CAT.minum, CAT.dapur, STORE, CAT.lain]
  );
  await q(
    `insert into customers (id, store_id, name, phone, address) values
     ($1,$4,'Bu Ani','0812-3333-4444','Jl. Kenanga No. 3'),
     ($2,$4,'Pak Joko','0813-5555-6666','Jl. Anggrek No. 8'),
     ($3,$4,'Mbak Lily','0857-7777-8888','Perum Griya Asri')`,
    [PEL.ani, PEL.joko, PEL.lily, STORE]
  );
  await q(
    `insert into suppliers (id, store_id, name, phone, address) values
     ($1,$3,'UD Sinar Mas','031-555-1234','Jl. Pasar Keputran'),
     ($2,$3,'CV Makmur Sentosa','031-555-9876','Jl. Tambak Mayor')`,
    [SUP.sinar, SUP.makmur, STORE]
  );
  for (const p of PROD) {
    await q(
      `insert into products (id, store_id, category_id, name, sku, barcode, unit,
         purchase_price, selling_price, stock_qty, min_stock, image_url, is_active)
       values ($1,$2,$3,$4,$5,$6,'pcs',$7,$8,$9,$10,$11,true)`,
      [p.id, STORE, p.cat, p.name, p.sku, p.barcode, p.beli, p.jual, p.stok, p.min, p.emoji]
    );
  }
  // multi-satuan grosir untuk beberapa barang
  await q(
    `insert into product_units (product_id, unit_name, conversion_factor, selling_price, is_base_unit) values
     ($1,'Pcs',1,3000,true),($1,'Bal',10,28500,false),($1,'Dus',40,108000,false),
     ($2,'Pcs',1,3500,true),($2,'Pack',12,39000,false),
     ($3,'Pcs',1,2300,true),($3,'Renceng',10,22500,false)`,
    [bySku["DIM-0001"].id, bySku["AIR-0001"].id, bySku["RKK-0001"].id]
  );

  // --- penjualan 7 hari (hari, jam, menit, kasir, metode, [sku, qty]...) ---
  const TRANSAKSI = [
    [6, 8, 5, SITI, "cash", [["DIM-0001", 8], ["KOP-0001", 10]]],
    [6, 10, 15, SITI, "cash", [["MNY-0001", 2], ["AIR-0001", 6]]],
    [6, 15, 42, SITI, "cash", [["BRS-0001", 1], ["GLA-0001", 2]]],
    [5, 8, 2, RINA, "cash", [["RKK-0001", 1]]],
    [5, 11, 12, SITI, "cash", [["LPG-0001", 2], ["SBN-0001", 2]]],
    [5, 13, 30, SITI, "cash", [["SKM-0001", 2], ["TEH-0001", 1]]],
    [5, 16, 50, SITI, "cash", [["BRS-0001", 2], ["TEL-0001", 1]]],
    [4, 8, 1, SITI, "cash", [["KOP-0001", 20]]],
    [4, 10, 8, SITI, "cash", [["TEL-0001", 2]]],
    [4, 12, 20, RINA, "cash", [["DIM-0001", 12], ["AIR-0001", 12]]],
    [4, 15, 45, SITI, "cash", [["BRS-0001", 1], ["MNY-0001", 1], ["GLA-0001", 1]]],
    [4, 16, 20, SITI, "credit", [["KEC-0001", 2], ["ROY-0001", 3], ["MGR-0001", 2]]], // Pak Joko 85rb
    [3, 9, 10, SITI, "cash", [["SKM-0001", 4]]],
    [3, 12, 25, SITI, "cash", [["LPG-0001", 3], ["RKK-0001", 10]]],
    [3, 17, 40, SITI, "cash", [["BRS-0001", 3]]],
    [2, 8, 9, SITI, "cash", [["DIM-0001", 20]]],
    [2, 10, 18, RINA, "cash", [["TEH-0001", 2], ["KOP-0001", 6]]],
    [2, 13, 35, SITI, "cash", [["MNY-0001", 4], ["AIR-0001", 24]]],
    [2, 18, 55, SITI, "cash", [["BRS-0001", 2], ["GLA-0001", 3]]],
    [1, 7, 50, SITI, "cash", [["GLA-0001", 2]]],
    [1, 9, 6, SITI, "cash", [["MNY-0001", 3]]],
    [1, 11, 16, SITI, "cash", [["AIR-0001", 12], ["KOP-0001", 8]]],
    [1, 14, 28, SITI, "cash", [["LPG-0001", 2], ["SBN-0001", 3]]],
    [1, 16, 44, RINA, "cash", [["RKK-0001", 20]]],
    [1, 18, 58, SITI, "cash", [["BRS-0001", 2], ["TEL-0001", 2]]],
    // hari ini: jam mundur dari sekarang agar tidak ada struk "masa depan"
    [0, 0, 240, SITI, "cash", [["SBN-0001", 2], ["RKK-0001", 10]]],
    [0, 0, 150, SITI, "cash", [["DIM-0001", 5], ["KOP-0001", 4], ["LPG-0001", 1]]],
    [0, 0, 45, SITI, "cash", [["BRS-0001", 1], ["AIR-0001", 6]]],
    [0, 0, 20, SITI, "credit", [["GLA-0001", 1], ["TEH-0001", 1]]], // Bu Ani hari ini
  ];

  let urutPerHari = {};
  let no = 0;
  const tanggalSalin = {}; // simpan tanggal utk shift
  for (const [hariLalu, jam, offsetMenit, kasirId, metode, itemSkus] of TRANSAKSI) {
    let tanggal = waktuLalu(hariLalu, 9, 0);
    if (hariLalu === 0) {
      tanggal = new Date(Date.now() - offsetMenit * 60000);
    } else {
      tanggal = waktuLalu(hariLalu, jam, offsetMenit % 60);
    }
    const kunciHari = tanggal.toISOString().slice(0, 10);
    urutPerHari[kunciHari] = (urutPerHari[kunciHari] ?? 0) + 1;
    const struk = nomorStruk(tanggal, urutPerHari[kunciHari]);
    const items = itemSkus.map(([sku, qty]) => ({ p: bySku[sku], qty }));
    const subtotal = items.reduce((a, i) => a + i.p.jual * i.qty, 0);
    const status = metode === "credit" ? "credit" : "paid";
    const saleId = `s-${++no}-seed0`;

    await q(
      `insert into sales (id, store_id, shift_id, receipt_number, cashier_id, customer_id, status,
         subtotal, discount, discount_type, total, payment_method, amount_paid, change_amount, paid_at, created_at)
       values (gen_random_uuid(), $1, null, $2, $3, $4, $5, $6, 0, 'fixed', $6, $7, $8, 0, $9, $9)
       returning id`,
      [
        STORE, struk, kasirId,
        metode === "credit" ? (hariLalu === 4 ? PEL.joko : PEL.ani) : null,
        status, subtotal, metode,
        metode === "credit" ? 0 : subtotal,
        tanggal,
      ]
    ).then(async (r) => {
      const sid = r.rows[0].id;
      tanggalSalin[struk] = sid;
      for (const i of items) {
        await q(
          `insert into sale_items (sale_id, product_id, quantity, unit_price, total) values ($1,$2,$3,$4,$5)`,
          [sid, i.p.id, i.qty, i.p.jual, i.p.jual * i.qty]
        );
        await q(
          `insert into stock_mutations (store_id, product_id, mutation_type, reason, quantity, sale_id, created_by, created_at)
           values ($1,$2,'out','sale',$3,$4,$5,$6)`,
          [STORE, i.p.id, i.qty, sid, kasirId, tanggal]
        );
      }
      if (metode !== "credit") {
        await q(
          `insert into cash_flows (store_id, flow_type, amount, category, method, reference_type, reference_id, created_at)
           values ($1,'in',$2,'sale_payment','cash','sale',$3,$4)`,
          [STORE, subtotal, sid, tanggal]
        );
      }
      if (metode === "credit") {
        await q(
          `insert into receivables (store_id, sale_id, customer_id, original_amount, paid_amount, status, created_at)
           values ($1,$2,$3,$4,$5,$6,$7)`,
          [STORE, sid, hariLalu === 4 ? PEL.joko : PEL.ani, subtotal, hariLalu === 4 ? 0 : 0, "unpaid", tanggal]
        );
      }
    });
  }

  // Bu Ani: kasbon lama 200rb sudah dibayar 50rb -> sisa 150rb sesuai PRD
  {
    const tAwal = waktuLalu(8, 9, 15);
    const tBayar = waktuLalu(5, 10, 30);
    const rc = await q(
      `insert into sales (store_id, receipt_number, cashier_id, customer_id, status, subtotal, total, payment_method, amount_paid, created_at)
       values ($1,'STR-LAMA-0001',$2,$3,'credit',200000,200000,'credit',0,$4) returning id`,
      [STORE, SITI, PEL.ani, tAwal]
    );
    const rid = (await q(
      `insert into receivables (store_id, sale_id, customer_id, original_amount, paid_amount, status, created_at)
       values ($1,$2,$3,200000,0,'unpaid',$4) returning id`,
      [STORE, rc.rows[0].id, PEL.ani, tAwal]
    )).rows[0].id;
    await q(
      `insert into receivable_payments (store_id, receivable_id, amount, note, accepted_by, paid_at)
       values ($1,$2,50000,'Cicilan pertama',$3,$4)`,
      [STORE, rid, SITI, tBayar]
    );
    await q(`update receivables set paid_amount = 50000, status='partial' where id = $1`, [rid]);
    await q(
      `insert into cash_flows (store_id, flow_type, amount, category, method, reference_type, reference_id, created_at)
       values ($1,'in',50000,'receivable_payment','cash','receivable',$2,$3)`,
      [STORE, rid, tBayar]
    );
  }

  // pembelian supplier: 1 kredit (hutang berjalan), 1 tunai
  {
    const tKredit = waktuLalu(4, 9, 0);
    const pur1 = await q(
      `insert into purchases (store_id, supplier_id, invoice_number, status, subtotal, total, notes, created_by, created_at)
       values ($1,$2,'F-2026-0905','credit',500000,500000,'Belanja kredit sembako mingguan',$3,$4) returning id`,
      [STORE, SUP.sinar, BUDI, tKredit]
    );
    const pid1 = pur1.rows[0].id;
    await q(
      `insert into purchase_items (purchase_id, product_id, quantity, unit_cost, total) values
       ($1,$2,8,55000,440000),($1,$3,12,5000,60000)`,
      [pid1, bySku["BRS-0001"].id, bySku["MGR-0001"].id]
    );
    await q(
      `insert into stock_mutations (store_id, product_id, mutation_type, reason, quantity, purchase_id, note, created_by, created_at)
       values ($1,$2,'in','purchase',8,$3,'Kulakan dari UD Sinar Mas',$4,$5),
              ($1,$6,'in','purchase',12,$3,'Kulakan dari UD Sinar Mas',$4,$5)`,
      [STORE, bySku["BRS-0001"].id, pid1, BUDI, tKredit, bySku["MGR-0001"].id]
    );
    const pb = await q(
      `insert into payables (store_id, purchase_id, supplier_id, original_amount, paid_amount, status, due_date, created_at)
       values ($1,$2,$3,500000,0,'unpaid', current_date + 14, $4) returning id`,
      [STORE, pid1, SUP.sinar, tKredit]
    );
    for (const [hari, jumlah] of [[2, 100000], [1, 50000]]) {
      const t = waktuLalu(hari, 11, 0);
      await q(
        `insert into payable_payments (store_id, payable_id, amount, accepted_by, paid_at) values ($1,$2,$3,$4,$5)`,
        [STORE, pb.rows[0].id, jumlah, BUDI, t]
      );
      await q(
        `insert into cash_flows (store_id, flow_type, amount, category, method, reference_type, reference_id, created_at)
         values ($1,'out',$2,'payable_payment','cash','payable',$3,$4)`,
        [STORE, jumlah, pb.rows[0].id, t]
      );
    }
    await q(`update payables set paid_amount=150000, status='partial' where id=$1`, [pb.rows[0].id]);

    const tTunai = waktuLalu(2, 8, 30);
    const pur2 = await q(
      `insert into purchases (store_id, supplier_id, invoice_number, status, subtotal, total, paid_at, created_by, created_at)
       values ($1,$2,'F-2026-0907','paid',264000,264000,$3,$4,$3) returning id`,
      [STORE, SUP.makmur, tTunai, BUDI]
    );
    await q(
      `insert into purchase_items (purchase_id, product_id, quantity, unit_cost, total) values
       ($1,$2,60,2400,144000),($1,$3,48,2500,120000)`,
      [pur2.rows[0].id, bySku["DIM-0001"].id, bySku["AIR-0001"].id]
    );
    await q(
      `insert into stock_mutations (store_id, product_id, mutation_type, reason, quantity, purchase_id, note, created_by, created_at)
       values ($1,$2,'in','purchase',60,$4,'Kulakan dari CV Makmur Sentosa',$5,$3),
              ($1,$6,'in','purchase',48,$4,'Kulakan dari CV Makmur Sentosa',$5,$3)`,
      [STORE, bySku["DIM-0001"].id, tTunai, pur2.rows[0].id, BUDI, bySku["AIR-0001"].id]
    );
    await q(
      `insert into cash_flows (store_id, flow_type, amount, category, method, reference_type, reference_id, created_at)
       values ($1,'out',264000,'purchase_payment','cash','purchase',$2,$3)`,
      [STORE, pur2.rows[0].id, tTunai]
    );
  }

  // gula rusak 2 (kemarin)
  await q(
    `insert into stock_mutations (store_id, product_id, mutation_type, reason, quantity, note, created_by, created_at)
     values ($1,$2,'out','damage',2,'Kemasan sobek dimakan tikus',$3,$4)`,
    [STORE, bySku["GLA-0001"].id, SITI, waktuLalu(1, 7, 50)]
  );

  // pengeluaran hari ini: token listrik 50rb (PRD Bab 9)
  {
    const t = waktuLalu(0, 9, 45) > new Date() ? new Date(Date.now() - 20 * 60000) : waktuLalu(0, 9, 45);
    const ex = await q(
      `insert into expenses (store_id, title, category, amount, note, paid_at, created_by, created_at)
       values ($1,'Beli token listrik toko','Operasional',50000,$2,$3,$4,$3) returning id`,
      [STORE, "PLN pascabayar no. 4501", t, SITI]
    );
    await q(
      `insert into cash_flows (store_id, flow_type, amount, category, method, reference_type, reference_id, created_at)
       values ($1,'out',50000,'expense','cash','expense',$2,$3)`,
      [STORE, ex.rows[0].id, t]
    );
    const t2 = waktuLalu(3, 15, 10);
    const ex2 = await q(
      `insert into expenses (store_id, title, category, amount, created_by, created_at)
       values ($1,'Iuran kebersihan kampung','Operasional',20000,$2,$3) returning id`,
      [STORE, BUDI, t2]
    );
    await q(
      `insert into cash_flows (store_id, flow_type, amount, category, method, reference_type, reference_id, created_at)
       values ($1,'out',20000,'expense','cash','expense',$2,$3)`,
      [STORE, ex2.rows[0].id, t2]
    );
  }

  // shift SITI kemarin, sudah tutup & cocok
  {
    const kemarin = waktuLalu(1, 8, 0);
    const tutup = waktuLalu(1, 20, 5);
    const kasMasuk = (await q(
      `select coalesce(sum(amount),0)::numeric as masuk from cash_flows
       where store_id=$1 and flow_type='in' and method='cash' and created_at between $2 and $3`,
      [STORE, kemarin, tutup]
    )).rows[0].masuk;
    const kasKeluar = (await q(
      `select coalesce(sum(amount),0)::numeric as keluar from cash_flows
       where store_id=$1 and flow_type='out' and method='cash' and created_at between $2 and $3`,
      [STORE, kemarin, tutup]
    )).rows[0].keluar;
    const seharusnya = 150000 + Number(kasMasuk) - Number(kasKeluar);
    await q(
      `insert into cashier_shifts (store_id, cashier_id, opened_at, closed_at, starting_cash, expected_cash, actual_cash, cash_difference, status)
       values ($1,$2,$3,$4,150000,$5,$5,0,'closed')`,
      [STORE, SITI, kemarin, tutup, seharusnya]
    );
  }

  // notifikasi stok menipis utk pemilik & kasir
  await q(
    `insert into notifications (store_id, user_id, type, title, message, data, is_read, created_at) values
     ($1,$2,'stock_low','Stok Menipis','Minyak Goreng 1L sisa 2 (batas minimum 5). Segera kulakan!','{}',false,now() - interval '3 hours'),
     ($1,$2,'stock_low','Stok Menipis','Telur Ayam 1Kg sisa 8 (batas minimum 10).','{}',false,now() - interval '3 hours'),
     ($1,$2,'sale_paid','Penjualan Baru','Siti Rahma menyelesaikan transaksi hari ini.','{}',true,now() - interval '2 hours'),
     ($1,$3,'stock_low','Stok Menipis','Jangan lupa: Minyak Goreng hampir habis.','{}',false,now() - interval '1 hour')`,
    [STORE, BUDI, SITI]
  );

  await q("commit");
  const ringkas = await q(
    `select
      (select count(*) from products where store_id=$1) as produk,
      (select count(*) from sales where store_id=$1) as penjualan,
      (select count(*) from receivables where store_id=$1) as kasbon,
      (select count(*) from payables where store_id=$1) as hutang`,
    [STORE]
  );
  console.log("Seed selesai:", JSON.stringify(ringkas.rows[0]));
  console.log("Login demo -> budi@tokoberkah.id/rahasia (pemilik, PIN void 8765) • siti@tokoberkah.id PIN 1234");
} catch (e) {
  await q("rollback");
  throw e;
} finally {
  c.release();
  await pool.end();
}
