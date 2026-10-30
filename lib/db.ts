import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import { DB_PATH } from "@/lib/config";

const g = globalThis as unknown as { __db?: Database.Database };

function init(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  db.exec(`CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    attempted_at TEXT DEFAULT CURRENT_TIMESTAMP,
    success INTEGER NOT NULL
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    alamat TEXT,
    jam_buka TEXT,
    jam_tutup TEXT,
    rating REAL DEFAULT 0,
    ulasan_count INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    deskripsi TEXT,
    harga TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    ulasan TEXT,
    waktu TEXT,
    stars INTEGER DEFAULT 5,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS faqs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS wishlist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_type, item_id)
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS content_blocks (
    key TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  function ensureColumn(table: string, column: string, definition: string) {
    const cols = (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name);
    if (!cols.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }

  ensureColumn("stores", "jam_tutup", "TEXT");
  ensureColumn("stores", "image_url", "TEXT");
  ensureColumn("stores", "ulasan_count", "INTEGER DEFAULT 0");
  ensureColumn("stores", "sort_order", "INTEGER DEFAULT 0");
  ensureColumn("menu_items", "sort_order", "INTEGER DEFAULT 0");
  ensureColumn("menu_items", "store_id", "INTEGER REFERENCES stores(id)");
  ensureColumn("menu_items", "image_url", "TEXT");

  const updateStoreHours = db.prepare("UPDATE stores SET jam_buka = ?, jam_tutup = ? WHERE id = ?");
  (db.prepare("SELECT id, jam_buka, jam_tutup FROM stores").all() as any[]).forEach((store) => {
    if (!store.jam_buka || store.jam_tutup) return;
    const range = String(store.jam_buka).match(
      /^\s*(\d{1,2})[:.](\d{2})\s*[-\u2013\u2014]\s*(\d{1,2})[:.](\d{2})\s*$/
    );
    if (range) {
      updateStoreHours.run(
        `${range[1].padStart(2, "0")}:${range[2]}`,
        `${range[3].padStart(2, "0")}:${range[4]}`,
        store.id
      );
      return;
    }
    const opening = String(store.jam_buka).match(/^\s*(\d{1,2})[:.](\d{2})\s*$/);
    if (opening) {
      db.prepare("UPDATE stores SET jam_buka = ? WHERE id = ?").run(
        `${opening[1].padStart(2, "0")}:${opening[2]}`,
        store.id
      );
    }
  });

  ["jarak", "status"].forEach((column) => {
    const cols = (db.prepare("PRAGMA table_info(stores)").all() as { name: string }[]).map((e) => e.name);
    if (cols.includes(column)) db.exec(`ALTER TABLE stores DROP COLUMN ${column}`);
  });
  ensureColumn("testimonials", "stars", "INTEGER DEFAULT 5");
  ensureColumn("testimonials", "sort_order", "INTEGER DEFAULT 0");
  ensureColumn("testimonials", "target_type", "TEXT");
  ensureColumn("testimonials", "target_id", "INTEGER");
  ensureColumn("testimonials", "target_nama", "TEXT");

  const hadApproved = (db.prepare("PRAGMA table_info(testimonials)").all() as { name: string }[]).some(
    (c) => c.name === "approved"
  );
  ensureColumn("testimonials", "approved", "INTEGER DEFAULT 0");
  if (!hadApproved) db.prepare("UPDATE testimonials SET approved = 1").run();
  ensureColumn("faqs", "sort_order", "INTEGER DEFAULT 0");

  ensureColumn("users", "role", "TEXT DEFAULT 'user'");
  ensureColumn("users", "status", "TEXT DEFAULT 'approved'");
  ensureColumn("users", "store_id", "INTEGER REFERENCES stores(id)");
  ensureColumn("stores", "approval_status", "TEXT DEFAULT 'approved'");

  function seedContentBlock(key: string, data: unknown) {
    if (!db.prepare("SELECT key FROM content_blocks WHERE key = ?").get(key)) {
      db.prepare("INSERT INTO content_blocks (key, data) VALUES (?, ?)").run(key, JSON.stringify(data));
    }
  }

  seedContentBlock("site", { site_title: "Pisang Ijo", logo_text: "Pisang Ijo" });
  seedContentBlock("hero", {
    badge: "Platform Kuliner Makassar",
    heading: "Temukan Es Pisang Ijo Favorit Kamu",
    subheading: "Jelajahi pilihan es pisang ijo dan temukan menu kesukaanmu",
    search_placeholder: "Cari toko atau menu es pisang ijo",
    cta_primary: "Cari Toko",
    cta_secondary: "Lihat Menu",
  });
  seedContentBlock("toko_populer", {
    heading: "Toko Populer & Rating",
    subheading: "Temukan toko yang sesuai dengan citarasa kesukaanmu.",
    link_text: "Lihat semua toko",
  });
  seedContentBlock("menu_section", {
    heading: "Menu Unggulan",
    subheading: "Pilih paduan rasa favorit untuk anda coba nanti",
  });
  seedContentBlock("about", {
    eyebrow: "Tentang Platform",
    heading: "Merayakan segarnya rasa yang akrab",
    description:
      "Pisang Ijo Kita adalah platform yang menghubungkan para pecinta kuliner tradisional Makassar dengan mitra UMKM dan kedai lokal terbaik di seluruh Jabodetabek. Kami berkomitmen untuk melestarikan cita rasa nusantara melalui kemudahan pemesanan online, jaminan kebersihan, serta standar kualitas bahan baku kelapa dan pisang pilihan yang selalu segar setiap hari.",
    media_text: "Ceritanya Gambar Bahan Bahan Pisang Ijo",
    images: [],
    image_url: "",
    pill_1: "Pisang Segar Pilihan",
    pill_2: "Santan Lembut",
    pill_3: "Layanan Penuh Perhatian",
  });
  seedContentBlock("history", {
    heading: "Sejarah Pisang Ijo",
    text: "Berawal dari kecintaan mendalam terhadap kuliner tradisional, Pisang Ijo Kita hadir untuk menyajikan kelezatan Es Pisang Ijo otentik khas Makassar langsung ke hadapan Anda. Sejak pertama kali berdiri, kami konsisten menjaga kualitas rasa melalui pemilihan pisang pilihan yang matang pas, adonan lembut berbalut daun suji alami, dipadu dengan gurihnya vla santan dan es yang menyegarkan. Kini, kami terus berkembang dan memperluas jangkauan melalui kemitraan di berbagai titik strategis agar dapat melayani pelanggan setia dengan lebih dekat dan cepat.",
  });
  seedContentBlock("testimonial_section", {
    eyebrow: "Kota Mereka #MerekaBicara",
    heading: "Testimoni Pelanggan",
    cta: "Tulis Ulasan",
  });
  seedContentBlock("cari_toko", {
    eyebrow: "Pencarian Lokasi",
    heading: "Cari Toko Es Pisang Ijo",
    subheading: "Masukkan nama toko atau menu dan area/kota secara manual",
  });
  seedContentBlock("faq_section", {
    eyebrow: "Butuh Bantuan?",
    heading: "Pertanyaan Yang Sering Ditanyakan",
  });
  seedContentBlock("contact", {
    eyebrow: "Kontak",
    heading: "Mari ngobrol tentang rasa favoritmu",
    email: "halo@pisangijokita.com",
    whatsapp: "+62 700 0000 0000",
    note: "Butuh bantuan menggunakan halaman demo ini? Hubungi kanal contoh berikut pada jam layanan umum.",
    hours: "Senin - Sabtu, 09.00 - 18.00",
  });
  seedContentBlock("footer", {
    tagline: "Platform demo untuk menjelajahi menu dan toko es pisang ijo",
    social_text: "Sosial demo : Instagram - TikTok - Facebook",
    help_email: "halo@pisangijokita.com",
    help_whatsapp: "+62 800 0000 0000",
    legal_terms_label: "Syarat & Ketentuan",
    legal_privacy_label: "Kebijakan Privasi",
    copyright: "2026 Pisang Ijo",
  });

  const count = (t: string) => (db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get() as { c: number }).c;

  if (count("stores") === 0) {
    const ins = db.prepare(
      `INSERT INTO stores (nama, alamat, jam_buka, jam_tutup, rating, ulasan_count, sort_order)
       VALUES (@nama, @alamat, @jam_buka, @jam_tutup, @rating, @ulasan_count, @sort_order)`
    );
    [
      { nama: "Es Pisang Ijo Bu Ida", alamat: "Jl. Pengayoman, Makassar", jam_buka: "08:00", jam_tutup: "21:00", rating: 4.8, ulasan_count: 128, sort_order: 1 },
      { nama: "Pisang Ijo Daeng Sija", alamat: "Jl. Boulevard, Makassar", jam_buka: "09:00", jam_tutup: "20:00", rating: 4.6, ulasan_count: 96, sort_order: 2 },
      { nama: "Pisang Ijo Ratu Rasa", alamat: "Jl. Sultan Alauddin, Makassar", jam_buka: "10:00", jam_tutup: "18:00", rating: 4.5, ulasan_count: 54, sort_order: 3 },
    ].forEach((s) => ins.run(s));
  }

  if (count("menu_items") === 0) {
    const ins = db.prepare(
      `INSERT INTO menu_items (nama, deskripsi, harga, sort_order, store_id)
       VALUES (@nama, @deskripsi, @harga, @sort_order, @store_id)`
    );
    [
      { nama: "Pisang Ijo Original", deskripsi: "Saus santan, bubur sumsum", harga: "Rp 15.000", sort_order: 1, store_id: 1 },
      { nama: "Pisang Ijo Cokelat", deskripsi: "Topping cokelat leleh", harga: "Rp 17.000", sort_order: 2, store_id: 1 },
      { nama: "Pisang Ijo Durian", deskripsi: "Dengan durian asli", harga: "Rp 20.000", sort_order: 3, store_id: 2 },
      { nama: "Pisang Ijo Keju", deskripsi: "Taburan keju parut", harga: "Rp 18.000", sort_order: 4, store_id: 3 },
    ].forEach((m) => ins.run(m));
  }

  if (count("testimonials") === 0) {
    const ins = db.prepare(
      `INSERT INTO testimonials (nama, ulasan, waktu, stars, sort_order)
       VALUES (@nama, @ulasan, @waktu, @stars, @sort_order)`
    );
    const teks =
      "Porem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.";
    [
      { nama: "Rangga", ulasan: teks, waktu: "2 hari yang lalu", stars: 5, sort_order: 1 },
      { nama: "Salsabila", ulasan: teks, waktu: "5 hari yang lalu", stars: 5, sort_order: 2 },
      { nama: "Fajar", ulasan: teks, waktu: "1 minggu yang lalu", stars: 5, sort_order: 3 },
    ].forEach((t) => ins.run(t));
  }

  if (count("faqs") === 0) {
    const ins = db.prepare(
      `INSERT INTO faqs (question, answer, sort_order) VALUES (@question, @answer, @sort_order)`
    );
    [
      { question: "Bagaimana Cara Pesan?", answer: "Pilih toko atau menu favoritmu, lalu hubungi toko langsung melalui kontak yang tersedia di halaman detail toko.", sort_order: 1 },
      { question: "Apakah tersedia pilihan varian?", answer: "Ya, sebagian besar toko menyediakan beberapa varian topping dan tingkat kemanisan.", sort_order: 2 },
      { question: "Berapa estimasi proses pesanan?", answer: "Estimasi waktu bervariasi tergantung toko, umumnya 15-30 menit setelah pesanan dikonfirmasi.", sort_order: 3 },
      { question: "Bagaimana cara daftar akun?", answer: "Klik tombol Login / Sign In di bagian atas halaman, lalu ikuti langkah pendaftaran akun baru.", sort_order: 4 },
      { question: "Bagaimana cara memberi ulasan?", answer: "Setelah login, kamu dapat menekan tombol Tulis Ulasan pada bagian testimoni pelanggan.", sort_order: 5 },
      { question: "Apakah semua toko menerima pesanan online?", answer: "Tidak semua, status penerimaan pesanan online ditampilkan pada masing-masing halaman toko.", sort_order: 6 },
    ].forEach((f) => ins.run(f));
  }

  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    const username = process.env.ADMIN_USERNAME;
    const existing = db.prepare("SELECT id FROM admin_users WHERE username = ?").get(username);
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12);
    if (!existing) {
      db.prepare("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)").run(username, hash);
      console.log(`Admin user "${username}" created from environment variables.`);
    } else {
      db.prepare("UPDATE admin_users SET password_hash = ? WHERE username = ?").run(hash, username);
      console.log(`Admin user "${username}" password synced from environment variables.`);
    }
  }

  return db;
}

const db = (g.__db ??= init());
export default db;