import { randomBytes } from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const COOKIE = "sid";
const TTL_MS = 8 * 60 * 60 * 1000;

export type SessionData = {
  adminId?: number;
  username?: string;
  userId?: number;
  userNama?: string;
};

export async function readSession(req: NextRequest): Promise<SessionData> {
  const sid = req.cookies.get(COOKIE)?.value;
  if (!sid) return {};
  const row = await prisma.session.findUnique({ where: { sid } });
  if (!row || Number(row.expires) < Date.now()) return {};
  try {
    return JSON.parse(row.data);
  } catch {
    return {};
  }
}

export async function endSession(req: NextRequest, res: NextResponse) {
  const sid = req.cookies.get(COOKIE)?.value;
  if (sid) await prisma.session.deleteMany({ where: { sid } });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
}

export async function startSession(req: NextRequest, res: NextResponse, data: SessionData) {
  const old = req.cookies.get(COOKIE)?.value;
  if (old) await prisma.session.deleteMany({ where: { sid: old } });
  const sid = randomBytes(24).toString("hex");
  await prisma.session.create({
    data: { sid, data: JSON.stringify(data), expires: BigInt(Date.now() + TTL_MS) },
  });
  res.cookies.set(COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: TTL_MS / 1000,
    secure: process.env.COOKIE_SECURE === "true",
  });
}