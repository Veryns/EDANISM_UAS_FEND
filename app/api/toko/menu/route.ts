import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireToko } from "@/lib/auth";
import { jsonBody } from "@/lib/serialize";
import { cleanMenuBody, readMenuImages, imagesToColumn, MAX_MENU_IMAGES } from "@/lib/tokoMenu";

export async function GET(req: NextRequest) {
  const t = await requireToko(req);
  if (t instanceof NextResponse) return t;
  if (!t.store_id) return NextResponse.json([]);
  const rows = await prisma.menuItem.findMany({
    where: { store_id: t.store_id },
    orderBy: [{ sort_order: "asc" }, { id: "asc" }],
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const t = await requireToko(req);
  if (t instanceof NextResponse) return t;
  if (!t.store_id) return NextResponse.json({ error: "Toko tidak ditemukan." }, { status: 404 });
  const body = await jsonBody(req);

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

  const row = await prisma.menuItem.create({
    data: {
      nama: m.nama,
      deskripsi: m.deskripsi || "",
      harga: m.harga || "",
      image_url: imagesToColumn(images || []),
      store_id: t.store_id,
      sort_order: 0,
    },
  });
  return NextResponse.json({ ok: true, menu: row }, { status: 201 });
}