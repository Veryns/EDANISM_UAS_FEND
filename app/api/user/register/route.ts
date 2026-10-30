import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import db from "@/lib/db";
import { startSession } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function POST(req: NextRequest) {
  if (!checkRateLimit(req, "user-auth", 20, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });
  }
  const { nama, email, password }: any = (await req.json().catch(() => ({}))) || {};
  if (!nama || !email || !password) {
    return NextResponse.json({ error: "Nama, email, dan password wajib diisi." }, { status: 400 });
  }
  if (!isValidEmail(email)) return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });

  if (db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase())) {
    return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 12);
  const result = db
    .prepare("INSERT INTO users (nama, email, password_hash) VALUES (?, ?, ?)")
    .run(nama.trim(), email.toLowerCase().trim(), hash);

  const res = NextResponse.json(
    { ok: true, nama: nama.trim(), email: email.toLowerCase().trim() },
    { status: 201 }
  );
  startSession(req, res, { userId: Number(result.lastInsertRowid), userNama: nama.trim() });
  return res;
}