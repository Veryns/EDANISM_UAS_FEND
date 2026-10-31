import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { readSession } from "@/lib/session";

export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const s = await readSession(req);
  if (!s.adminId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return null;
}

export async function requireUser(req: NextRequest): Promise<{ userId: number } | NextResponse> {
  const s = await readSession(req);
  if (!s.userId) return NextResponse.json({ error: "Kamu harus login dulu." }, { status: 401 });
  return { userId: s.userId };
}

export type TokoUser = { id: number; role: string; status: string; store_id: number | null };

export async function requireToko(req: NextRequest): Promise<TokoUser | NextResponse> {
  const s = await readSession(req);
  if (!s.userId) return NextResponse.json({ error: "Kamu harus login dulu." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: s.userId },
    select: { id: true, role: true, status: true, store_id: true },
  });
  if (!user || user.role !== "toko") {
    return NextResponse.json({ error: "Akses khusus akun toko." }, { status: 403 });
  }
  if (user.status !== "approved") {
    return NextResponse.json({ error: "Akun toko kamu belum disetujui admin." }, { status: 403 });
  }
  return user;
}