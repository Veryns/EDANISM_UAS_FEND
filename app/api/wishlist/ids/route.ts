import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const u = await requireUser(req);
  if (u instanceof NextResponse) return u;
  const rows = await prisma.wishlistItem.findMany({
    where: { user_id: u.userId },
    select: { item_type: true, item_id: true },
  });
  return NextResponse.json(rows);
}