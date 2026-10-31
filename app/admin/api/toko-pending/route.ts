import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  const rows = await prisma.user.findMany({
    where: { role: "toko", status: "pending", store: { isNot: null } },
    include: { store: true },
    orderBy: { created_at: "asc" },
  });
  return NextResponse.json(
    rows.map((u) => ({
      user_id: u.id,
      nama: u.nama,
      email: u.email,
      created_at: u.created_at,
      store_id: u.store?.id,
      store_nama: u.store?.nama,
      store_alamat: u.store?.alamat,
    }))
  );
}