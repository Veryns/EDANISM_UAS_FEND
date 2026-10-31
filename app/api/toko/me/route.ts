import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireToko } from "@/lib/auth";
import { jsonBody } from "@/lib/serialize";

export async function GET(req: NextRequest) {
  const t = await requireToko(req);
  if (t instanceof NextResponse) return t;
  const store = t.store_id ? await prisma.store.findUnique({ where: { id: t.store_id } }) : null;
  return NextResponse.json({ store });
}

export async function PUT(req: NextRequest) {
  const t = await requireToko(req);
  if (t instanceof NextResponse) return t;
  const store = t.store_id ? await prisma.store.findUnique({ where: { id: t.store_id } }) : null;
  if (!store) return NextResponse.json({ error: "Toko tidak ditemukan." }, { status: 404 });

  const { nama, alamat, jam_buka, jam_tutup, image_url, images } = await jsonBody(req);
  if (!nama || !String(nama).trim()) {
    return NextResponse.json({ error: "Nama toko wajib diisi." }, { status: 400 });
  }

  let imageValue = store.image_url;
  if (Array.isArray(images)) {
    imageValue = JSON.stringify(images.filter((u: unknown) => typeof u === "string" && u));
  } else if (image_url !== undefined) {
    imageValue = Array.isArray(image_url) ? JSON.stringify(image_url) : image_url;
  }

  const updated = await prisma.store.update({
    where: { id: store.id },
    data: {
      nama: String(nama).trim(),
      alamat: alamat !== undefined ? String(alamat).trim() : store.alamat,
      jam_buka: jam_buka !== undefined ? jam_buka : store.jam_buka,
      jam_tutup: jam_tutup !== undefined ? jam_tutup : store.jam_tutup,
      image_url: imageValue,
    },
  });
  return NextResponse.json({ ok: true, store: updated });
}