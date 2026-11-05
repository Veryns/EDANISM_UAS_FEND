import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { readSession } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";
import { jsonBody } from "@/lib/serialize";
import { dayKey } from "@/lib/day";

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
    const day = dayKey();
    await prisma.siteVisit.upsert({
      where: { visitor_id_day: { visitor_id: vid, day } },
      update: {},
      create: { visitor_id: vid, day, user_id: s.userId ?? null },
    });
  } catch {
    // pelacakan tidak boleh mengganggu website
  }
  return NextResponse.json({ ok: true });
}
