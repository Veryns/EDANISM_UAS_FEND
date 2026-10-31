import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { readSession } from "@/lib/session";
import { jsonBody } from "@/lib/serialize";

export async function POST(req: NextRequest) {
  const s = await readSession(req);
  if (!s.userId) {
    return NextResponse.json({ error: "Kamu harus login dulu untuk menulis ulasan." }, { status: 401 });
  }

  const { ulasan, stars, target_type, target_id } = await jsonBody(req);

  if (!ulasan || !String(ulasan).trim()) {
    return NextResponse.json({ error: "Ulasan tidak boleh kosong." }, { status: 400 });
  }
  if (target_type !== "store" && target_type !== "menu") {
    return NextResponse.json({ error: "Pilih dulu toko atau menu yang mau kamu ulas." }, { status: 400 });
  }

  const targetId = Number(target_id);
  if (!Number.isInteger(targetId)) {
    return NextResponse.json({ error: "Toko/menu yang dipilih tidak valid." }, { status: 400 });
  }
  const target =
    target_type === "store"
      ? await prisma.store.findUnique({ where: { id: targetId }, select: { id: true, nama: true } })
      : await prisma.menuItem.findUnique({ where: { id: targetId }, select: { id: true, nama: true } });
  if (!target) {
    return NextResponse.json({ error: "Toko/menu yang dipilih tidak ditemukan." }, { status: 400 });
  }

  const n = Number(stars);
  const finalStars = Number.isInteger(n) && n >= 1 && n <= 5 ? n : 5;

  await prisma.testimonial.create({
    data: {
      nama: s.userNama || "Pengguna",
      ulasan: String(ulasan).trim(),
      waktu: "Baru saja",
      stars: finalStars,
      approved: 0,
      sort_order: 0,
      target_type,
      target_id: target.id,
      target_nama: target.nama,
    },
  });

  return NextResponse.json(
    { ok: true, message: "Terima kasih! Ulasan kamu akan tampil setelah disetujui admin." },
    { status: 201 }
  );
}