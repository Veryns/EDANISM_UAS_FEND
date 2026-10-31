import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function setTokoStatus(
  req: NextRequest,
  ctx: { params: Promise<{ userId: string }> },
  status: "approved" | "rejected"
) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  const userId = Number((await ctx.params).userId);
  const user = Number.isInteger(userId)
    ? await prisma.user.findFirst({ where: { id: userId, role: "toko" } })
    : null;
  if (!user) return NextResponse.json({ error: "Pendaftaran toko tidak ditemukan." }, { status: 404 });

  await prisma.user.update({ where: { id: user.id }, data: { status } });
  if (user.store_id) {
    await prisma.store.update({ where: { id: user.store_id }, data: { approval_status: status } });
  }
  return NextResponse.json({ ok: true });
}