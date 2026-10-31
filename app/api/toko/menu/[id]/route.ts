import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireToko } from "@/lib/auth";
import { jsonBody } from "@/lib/serialize";
import { cleanMenuBody, readMenuImages, imagesToColumn, MAX_MENU_IMAGES } from "@/lib/tokoMenu";

type Ctx = { params: Promise<{ id: string }> };

async function ownMenu(id: string, storeId: number | null) {
  const n = Number(id);
  if (!Number.isInteger(n) || !storeId) return null;
  return prisma.menuItem.findFirst({ where: { id: n, store_id: storeId } });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const t = await requireToko(req);
  if (t instanceof NextResponse) return t;
  const row = await ownMenu((await ctx.params).id, t.store_id);
  if (!row) return NextResponse.json({ error: "Menu tidak ditemukan." }, { status: 404 });

  const body = await jsonBody(req);
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

  const updated = await prisma.menuItem.update({
    where: { id: row.id },
    data: {
      nama,
      deskripsi: m.deskripsi !== undefined ? m.deskripsi : row.deskripsi,
      harga: m.harga !== undefined ? m.harga : row.harga,
      image_url: images !== undefined ? imagesToColumn(images) : row.image_url,
    },
  });
  return NextResponse.json({ ok: true, menu: updated });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const t = await requireToko(req);
  if (t instanceof NextResponse) return t;
  const row = await ownMenu((await ctx.params).id, t.store_id);
  if (!row) return NextResponse.json({ error: "Menu tidak ditemukan." }, { status: 404 });

  await prisma.$transaction([
    prisma.testimonial.deleteMany({ where: { target_type: "menu", target_id: row.id } }),
    prisma.wishlistItem.deleteMany({ where: { item_type: "menu", item_id: row.id } }),
    prisma.menuItem.delete({ where: { id: row.id } }),
  ]);
  return NextResponse.json({ ok: true });
}