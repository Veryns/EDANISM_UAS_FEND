import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireToko } from "@/lib/auth";
import { cleanMenuBody, readMenuImages, imagesToColumn, MAX_MENU_IMAGES } from "@/lib/tokoMenu";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  const t = requireToko(req);
  if (t instanceof NextResponse) return t;
  const { id } = await ctx.params;
  const row = db
    .prepare("SELECT * FROM menu_items WHERE id = ? AND store_id = ?")
    .get(Number(id), t.store_id) as any;
  if (!row) return NextResponse.json({ error: "Menu tidak ditemukan." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const m = cleanMenuBody(body);
  const nama = m.nama !== undefined ? m.nama : row.nama;
  if (!nama) return NextResponse.json({ error: "Nama menu wajib diisi." }, { status: 400 });
  if (nama.length > 100) {
    return NextResponse.json({ error: "Nama menu maksimal 100 karakter." }, { status: 400 });
  }
  const images = readMenuImages(body);
  if (images === null) {
    return NextResponse.json(
      { error: "Gambar tidak valid (maksimal " + MAX_MENU_IMAGES + " gambar)." },
      { status: 400 }
    );
  }

  db.prepare("UPDATE menu_items SET nama = ?, deskripsi = ?, harga = ?, image_url = ? WHERE id = ?").run(
    nama,
    m.deskripsi !== undefined ? m.deskripsi : row.deskripsi,
    m.harga !== undefined ? m.harga : row.harga,
    images !== undefined ? imagesToColumn(images) : row.image_url,
    row.id
  );
  return NextResponse.json({ ok: true, menu: db.prepare("SELECT * FROM menu_items WHERE id = ?").get(row.id) });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const t = requireToko(req);
  if (t instanceof NextResponse) return t;
  const { id } = await ctx.params;
  const row = db
    .prepare("SELECT id FROM menu_items WHERE id = ? AND store_id = ?")
    .get(Number(id), t.store_id) as any;
  if (!row) return NextResponse.json({ error: "Menu tidak ditemukan." }, { status: 404 });

  db.prepare("DELETE FROM testimonials WHERE target_type = 'menu' AND target_id = ?").run(row.id);
  db.prepare("DELETE FROM wishlist_items WHERE item_type = 'menu' AND item_id = ?").run(row.id);
  db.prepare("DELETE FROM menu_items WHERE id = ?").run(row.id);
  return NextResponse.json({ ok: true });
}