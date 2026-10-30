import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { readSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const s = readSession(req);
  if (s.userId) {
    const user = db
      .prepare("SELECT nama, email, role, status, store_id FROM users WHERE id = ?")
      .get(s.userId);
    if (user) return NextResponse.json({ loggedIn: true, ...user });
  }
  return NextResponse.json({ loggedIn: false });
}