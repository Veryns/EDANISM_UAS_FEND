import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { readSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const s = await readSession(req);
  if (s.userId) {
    const user = await prisma.user.findUnique({
      where: { id: s.userId },
      select: { nama: true, email: true, role: true, status: true, store_id: true },
    });
    if (user) return NextResponse.json({ loggedIn: true, ...user });
  }
  return NextResponse.json({ loggedIn: false });
}