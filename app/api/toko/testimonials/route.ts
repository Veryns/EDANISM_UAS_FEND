import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireToko } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const t = requireToko(req);
  if (t instanceof NextResponse) return t;

  const menuIds = (db.prepare("SELECT id FROM menu_items WHERE store_id = ?").all(t.store_id) as any[]).map(
    (r) => r.id
  );
  const rows = db
    .prepare(
      `SELECT * FROM testimonials
       WHERE (target_type = 'store' AND target_id = ?)
          OR (target_type = 'menu' AND target_id IN (${menuIds.length ? menuIds.map(() => "?").join(",") : "NULL"}))
       ORDER BY id DESC`
    )
    .all(t.store_id, ...menuIds);
  return NextResponse.json(rows);
}