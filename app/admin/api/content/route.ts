import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  const rows = db.prepare("SELECT key, data FROM content_blocks").all() as any[];
  const result: Record<string, unknown> = {};
  rows.forEach((r) => (result[r.key] = JSON.parse(r.data)));
  return NextResponse.json(result);
}