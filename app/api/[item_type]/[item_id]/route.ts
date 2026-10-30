import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ item_type: string; item_id: string }> }
) {
  const u = requireUser(req);
  if (u instanceof NextResponse) return u;
  const { item_type, item_id } = await ctx.params;
  db.prepare("DELETE FROM wishlist_items WHERE user_id = ? AND item_type = ? AND item_id = ?").run(
    u.userId,
    item_type,
    item_id
  );
  return NextResponse.json({ ok: true });
}