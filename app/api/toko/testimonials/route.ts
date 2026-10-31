import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireToko } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const t = await requireToko(req);
  if (t instanceof NextResponse) return t;
  if (!t.store_id) return NextResponse.json([]);

  const menuIds = (await prisma.menuItem.findMany({ where: { store_id: t.store_id }, select: { id: true } })).map(
    (m) => m.id
  );
  const rows = await prisma.testimonial.findMany({
    where: {
      OR: [
        { target_type: "store", target_id: t.store_id },
        { target_type: "menu", target_id: { in: menuIds } },
      ],
    },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(rows);
}