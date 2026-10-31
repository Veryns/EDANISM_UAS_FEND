import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const s = await readSession(req);
  if (s.adminId) return NextResponse.json({ loggedIn: true, username: s.username });
  return NextResponse.json({ loggedIn: false });
}