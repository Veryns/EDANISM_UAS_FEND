import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireToko } from "@/lib/auth";
import { cleanMenuBody, readMenuImages, imagesToColumn, MAX_MENU_IMAGES } from "@/lib/tokoMenu";

export async function GET(req: NextRequest) {
  const t = requireToko(req);
  if (t instanceof NextResponse) return t;
  return NextResponse.json(
    db.prepare("SELECT * FROM menu_items WHERE store_id = ? ORDER BY sort_order ASC, id ASC").all(t.store_id)
  );
}

export async function POST(req: NextRequest) {
  const t = requireToko(req);
  if (t instanceof NextResponse) return t;
  const body = await req.json().catch(() => ({}));

  const m = cleanMenuBody(body);
  if (!m.nama) return NextResponse.json({ error: "Nama menu wajib diisi." }, { status: 400 });
  if (m.nama.length > 100) {
    return NextResponse.json({ error: "Nama menu maksimal 100 karakter." }, { status: 400 });
  }
  const images = readMenuImages(body);
  if (images === null) {
    return NextResponse.json(
      { error: "Gambar tidak valid (maksimal " + MAX_MENU_IMAGES + " gambar)." },
      { status: 400 }
    );
  }

  const info = db
    .prepare(
      "INSERT INTO menu_items (nama, deskripsi, harga, image_url, store_id, sort_order) VALUES (?, ?, ?, ?, ?, 0)"
    )
    .run(m.nama, m.deskripsi || "", m.harga || "", imagesToColumn(images || []), t.store_id);

  const row = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(info.lastInsertRowid);
  return NextResponse.json({ ok: true, menu: row }, { status: 201 });
}