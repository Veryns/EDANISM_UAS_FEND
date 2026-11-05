import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const role = req.nextUrl.searchParams.get("role") || "";

  const users = await prisma.user.findMany({
    where: {
      ...(role === "user" || role === "toko" ? { role } : {}),
      ...(q
        ? { OR: [{ nama: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
        : {}),
    },
    select: {
      id: true, nama: true, email: true, role: true, status: true, created_at: true,
      store: { select: { id: true, nama: true } },
      wishlist: { select: { item_type: true, item_id: true, created_at: true }, orderBy: { created_at: "desc" } },
    },
    orderBy: { created_at: "desc" },
    take: 500,
  });

  const menuIds = new Set<number>();
  const storeIds = new Set<number>();
  users.forEach((u) => u.wishlist.forEach((w) => (w.item_type === "menu" ? menuIds : storeIds).add(w.item_id)));
  const [menus, stores] = await Promise.all([
    menuIds.size
      ? prisma.menuItem.findMany({ where: { id: { in: [...menuIds] } }, select: { id: true, nama: true } })
      : [],
    storeIds.size
      ? prisma.store.findMany({ where: { id: { in: [...storeIds] } }, select: { id: true, nama: true } })
      : [],
  ]);
  const menuName = new Map(menus.map((m) => [m.id, m.nama]));
  const storeName = new Map(stores.map((s) => [s.id, s.nama]));

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      nama: u.nama,
      email: u.email,
      role: u.role,
      status: u.status,
      created_at: u.created_at,
      store_nama: u.store?.nama ?? null,
      wishlist_count: u.wishlist.length,
      wishlist: u.wishlist.map((w) => ({
        type: w.item_type,
        id: w.item_id,
        nama: (w.item_type === "menu" ? menuName : storeName).get(w.item_id) ?? "(sudah dihapus)",
        created_at: w.created_at,
      })),
    }))
  );
}
