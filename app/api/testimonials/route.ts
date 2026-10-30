import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { readSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const s = readSession(req);
  if (!s.userId) {
    return NextResponse.json({ error: "Kamu harus login dulu untuk menulis ulasan." }, { status: 401 });
  }

  const { ulasan, stars, target_type, target_id }: any = (await req.json().catch(() => ({}))) || {};

  if (!ulasan || !String(ulasan).trim()) {
    return NextResponse.json({ error: "Ulasan tidak boleh kosong." }, { status: 400 });
  }
  if (target_type !== "store" && target_type !== "menu") {
    return NextResponse.json({ error: "Pilih dulu toko atau menu yang mau kamu ulas." }, { status: 400 });
  }

  const targetIdNum = Number(target_id);
  if (!Number.isInteger(targetIdNum)) {
    return NextResponse.json({ error: "Toko/menu yang dipilih tidak valid." }, { status: 400 });
  }
  const targetRow = (
    target_type === "store"
      ? db.prepare("SELECT id, nama FROM stores WHERE id = ?").get(targetIdNum)
      : db.prepare("SELECT id, nama FROM menu_items WHERE id = ?").get(targetIdNum)
  ) as { id: number; nama: string } | undefined;

  if (!targetRow) {
    return NextResponse.json({ error: "Toko/menu yang dipilih tidak ditemukan." }, { status: 400 });
  }

  const starsNum = Number(stars);
  const finalStars = Number.isInteger(starsNum) && starsNum >= 1 && starsNum <= 5 ? starsNum : 5;

  db.prepare(
    `INSERT INTO testimonials (nama, ulasan, waktu, stars, approved, sort_order, target_type, target_id, target_nama)
     VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?)`
  ).run(
    s.userNama || "Pengguna",
    String(ulasan).trim(),
    "Baru saja",
    finalStars,
    target_type,
    targetRow.id,
    targetRow.nama
  );

  return NextResponse.json(
    { ok: true, message: "Terima kasih! Ulasan kamu akan tampil setelah disetujui admin." },
    { status: 201 }
  );
}