import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { readSession } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";
import { jsonBody } from "@/lib/serialize";
import { dayKey } from "@/lib/day";

// Mencatat 1 baris per pengunjung per hari (visitor_id anonim dari browser).
export async function POST(req: NextRequest) {
  if (!checkRateLimit(req, "track", 30, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: true });
  }
  const { vid } = await jsonBody(req);
  if (typeof vid !== "string" || !/^[A-Za-z0-9-]{16,64}$/.test(vid)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const s = await readSession(req).catch(() => ({}) as { userId?: number });
  try {
    await prisma.siteVisit.createMany({
      data: [{ visitor_id: vid, day: dayKey(), user_id: s.userId ?? null }],
      skipDuplicates: true,
    });
  } catch {
    // pelacakan tidak boleh mengganggu website
  }
  return NextResponse.json({ ok: true });
}
