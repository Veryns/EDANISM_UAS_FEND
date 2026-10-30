import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const u = requireUser(req);
  if (u instanceof NextResponse) return u;
  return NextResponse.json(
    db.prepare("SELECT item_type, item_id FROM wishlist_items WHERE user_id = ?").all(u.userId)
  );
}