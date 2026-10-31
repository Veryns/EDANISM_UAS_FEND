import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { jsonBody } from "@/lib/serialize";

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function POST(req: NextRequest) {
  if (!checkRateLimit(req, "user-auth", 20, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });
  }
  const { nama, email, password, nama_toko, alamat } = await jsonBody(req);
  if (!nama || !email || !password || !nama_toko) {
    return NextResponse.json({ error: "Nama, email, password, dan nama toko wajib diisi." }, { status: 400 });
  }
  if (!isValidEmail(email)) return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
  if (String(password).length < 8) return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });

  const mail = String(email).toLowerCase().trim();
  if (await prisma.user.findUnique({ where: { email: mail } })) {
    return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
  }

  const hash = await bcrypt.hash(String(password), 12);
  await prisma.user.create({
    data: {
      nama: String(nama).trim(),
      email: mail,
      password_hash: hash,
      role: "toko",
      status: "pending",
      store: {
        create: {
          nama: String(nama_toko).trim(),
          alamat: String(alamat || "").trim(),
          approval_status: "pending",
          sort_order: 0,
        },
      },
    },
  });

  return NextResponse.json(
    { ok: true, message: "Pendaftaran toko berhasil dikirim. Akunmu akan aktif setelah disetujui admin." },
    { status: 201 }
  );
}