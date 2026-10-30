import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  const { userId } = await ctx.params;
  const user = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'toko'").get(userId) as any;
  if (!user) return NextResponse.json({ error: "Pendaftaran toko tidak ditemukan." }, { status: 404 });
  db.prepare("UPDATE users SET status = 'rejected' WHERE id = ?").run(user.id);
  if (user.store_id) db.prepare("UPDATE stores SET approval_status = 'rejected' WHERE id = ?").run(user.store_id);
  return NextResponse.json({ ok: true });
}