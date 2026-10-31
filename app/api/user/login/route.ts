import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { startSession } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";
import { jsonBody } from "@/lib/serialize";

export async function POST(req: NextRequest) {
  if (!checkRateLimit(req, "user-auth", 20, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });
  }
  const { email, password } = await jsonBody(req);
  if (!email || !password) {
    return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });
  if (!user) return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
  if (!(await bcrypt.compare(String(password), user.password_hash))) {
    return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
  }

  if (user.role === "toko" && user.status !== "approved") {
    const msg =
      user.status === "pending"
        ? "Akun toko kamu masih menunggu persetujuan admin."
        : "Pendaftaran toko kamu ditolak admin.";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const res = NextResponse.json({ ok: true, nama: user.nama, email: user.email, role: user.role });
  await startSession(req, res, { userId: user.id, userNama: user.nama });
  return res;
}