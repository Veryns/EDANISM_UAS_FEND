import { NextRequest, NextResponse } from "next/server";
import { endSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true, redirect: "/admin/login" });
  endSession(req, res);
  return res;
}