import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import db from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function POST(req: NextRequest) {
  if (!checkRateLimit(req, "user-auth", 20, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });
  }
  const { nama, email, password, nama_toko, alamat }: any = (await req.json().catch(() => ({}))) || {};
  if (!nama || !email || !password || !nama_toko) {
    return NextResponse.json({ error: "Nama, email, password, dan nama toko wajib diisi." }, { status: 400 });
  }
  if (!isValidEmail(email)) return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });

  if (db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase())) {
    return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 12);
  const storeResult = db
    .prepare("INSERT INTO stores (nama, alamat, approval_status, sort_order) VALUES (?, ?, 'pending', 0)")
    .run(nama_toko.trim(), (alamat || "").trim());

  db.prepare(
    `INSERT INTO users (nama, email, password_hash, role, status, store_id)
     VALUES (?, ?, ?, 'toko', 'pending', ?)`
  ).run(nama.trim(), email.toLowerCase().trim(), hash, storeResult.lastInsertRowid);

  return NextResponse.json(
    { ok: true, message: "Pendaftaran toko berhasil dikirim. Akunmu akan aktif setelah disetujui admin." },
    { status: 201 }
  );
}