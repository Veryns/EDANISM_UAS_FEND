import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireToko } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const t = requireToko(req);
  if (t instanceof NextResponse) return t;
  const store = db.prepare("SELECT * FROM stores WHERE id = ?").get(t.store_id);
  return NextResponse.json({ store });
}

export async function PUT(req: NextRequest) {
  const t = requireToko(req);
  if (t instanceof NextResponse) return t;
  const store = db.prepare("SELECT * FROM stores WHERE id = ?").get(t.store_id) as any;
  if (!store) return NextResponse.json({ error: "Toko tidak ditemukan." }, { status: 404 });

  const { nama, alamat, jam_buka, jam_tutup, image_url, images }: any =
    (await req.json().catch(() => ({}))) || {};
  if (!nama || !String(nama).trim()) {
    return NextResponse.json({ error: "Nama toko wajib diisi." }, { status: 400 });
  }

  let imageValue = store.image_url;
  if (Array.isArray(images)) {
    imageValue = JSON.stringify(images.filter((u: unknown) => typeof u === "string" && u));
  } else if (image_url !== undefined) {
    imageValue = Array.isArray(image_url) ? JSON.stringify(image_url) : image_url;
  }

  db.prepare(
    `UPDATE stores SET nama = ?, alamat = ?, jam_buka = ?, jam_tutup = ?, image_url = ? WHERE id = ?`
  ).run(
    String(nama).trim(),
    alamat !== undefined ? String(alamat).trim() : store.alamat,
    jam_buka !== undefined ? jam_buka : store.jam_buka,
    jam_tutup !== undefined ? jam_tutup : store.jam_tutup,
    imageValue,
    store.id
  );

  const updated = db.prepare("SELECT * FROM stores WHERE id = ?").get(store.id);
  return NextResponse.json({ ok: true, store: updated });
}