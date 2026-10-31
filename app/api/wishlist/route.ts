import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { flatMenu, jsonBody } from "@/lib/serialize";

export async function GET(req: NextRequest) {
  const u = await requireUser(req);
  if (u instanceof NextResponse) return u;

  const rows = await prisma.wishlistItem.findMany({ where: { user_id: u.userId } });
  const menuIds = rows.filter((r) => r.item_type === "menu").map((r) => r.item_id);
  const storeIds = rows.filter((r) => r.item_type === "store").map((r) => r.item_id);

  const menu = menuIds.length
    ? (await prisma.menuItem.findMany({ where: { id: { in: menuIds } }, include: { store: true } })).map(flatMenu)
    : [];
  const stores = storeIds.length ? await prisma.store.findMany({ where: { id: { in: storeIds } } }) : [];

  return NextResponse.json({ menu, stores });
}

export async function POST(req: NextRequest) {
  const u = await requireUser(req);
  if (u instanceof NextResponse) return u;

  const { item_type, item_id } = await jsonBody(req);
  const id = Number(item_id);
  if (!["menu", "store"].includes(item_type) || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "item_type dan item_id wajib diisi." }, { status: 400 });
  }
  await prisma.wishlistItem.upsert({
    where: { user_id_item_type_item_id: { user_id: u.userId, item_type, item_id: id } },
    update: {},
    create: { user_id: u.userId, item_type, item_id: id },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}