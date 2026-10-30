import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const u = requireUser(req);
  if (u instanceof NextResponse) return u;

  const rows = db
    .prepare("SELECT item_type, item_id FROM wishlist_items WHERE user_id = ?")
    .all(u.userId) as any[];
  const menuIds = rows.filter((r) => r.item_type === "menu").map((r) => r.item_id);
  const storeIds = rows.filter((r) => r.item_type === "store").map((r) => r.item_id);

  const menu = menuIds.length
    ? db
        .prepare(
          `SELECT menu_items.*, stores.nama AS store_nama
           FROM menu_items LEFT JOIN stores ON stores.id = menu_items.store_id
           WHERE menu_items.id IN (${menuIds.map(() => "?").join(",")})`
        )
        .all(...menuIds)
    : [];
  const stores = storeIds.length
    ? db.prepare(`SELECT * FROM stores WHERE id IN (${storeIds.map(() => "?").join(",")})`).all(...storeIds)
    : [];

  return NextResponse.json({ menu, stores });
}

export async function POST(req: NextRequest) {
  const u = requireUser(req);
  if (u instanceof NextResponse) return u;

  const { item_type, item_id }: any = (await req.json().catch(() => ({}))) || {};
  if (!["menu", "store"].includes(item_type) || !item_id) {
    return NextResponse.json({ error: "item_type dan item_id wajib diisi." }, { status: 400 });
  }
  try {
    db.prepare("INSERT INTO wishlist_items (user_id, item_type, item_id) VALUES (?, ?, ?)").run(
      u.userId,
      item_type,
      item_id
    );
  } catch {
    // duplikat, abaikan
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}