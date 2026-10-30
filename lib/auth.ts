import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { readSession } from "@/lib/session";

export function requireAdmin(req: NextRequest): NextResponse | null {
  if (!readSession(req).adminId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return null;
}

export function requireUser(req: NextRequest): { userId: number } | NextResponse {
  const s = readSession(req);
  if (!s.userId) return NextResponse.json({ error: "Kamu harus login dulu." }, { status: 401 });
  return { userId: s.userId };
}

export type TokoUser = { id: number; role: string; status: string; store_id: number | null };

export function requireToko(req: NextRequest): TokoUser | NextResponse {
  const s = readSession(req);
  if (!s.userId) return NextResponse.json({ error: "Kamu harus login dulu." }, { status: 401 });

  const user = db
    .prepare("SELECT id, role, status, store_id FROM users WHERE id = ?")
    .get(s.userId) as TokoUser | undefined;

  if (!user || user.role !== "toko") {
    return NextResponse.json({ error: "Akses khusus akun toko." }, { status: 403 });
  }
  if (user.status !== "approved") {
    return NextResponse.json({ error: "Akun toko kamu belum disetujui admin." }, { status: 403 });
  }
  return user;
}