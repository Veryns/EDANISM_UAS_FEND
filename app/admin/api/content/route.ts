import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  const rows = await prisma.contentBlock.findMany();
  const result: Record<string, unknown> = {};
  rows.forEach((r) => (result[r.key] = JSON.parse(r.data)));
  return NextResponse.json(result);
}