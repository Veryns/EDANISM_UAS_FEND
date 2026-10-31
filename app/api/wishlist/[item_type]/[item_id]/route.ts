import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ item_type: string; item_id: string }> }
) {
  const u = await requireUser(req);
  if (u instanceof NextResponse) return u;
  const { item_type, item_id } = await ctx.params;
  await prisma.wishlistItem.deleteMany({
    where: { user_id: u.userId, item_type, item_id: Number(item_id) },
  });
  return NextResponse.json({ ok: true });
}