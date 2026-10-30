import { randomBytes } from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

db.exec(
  `CREATE TABLE IF NOT EXISTS sessions (sid TEXT PRIMARY KEY, data TEXT NOT NULL, expires INTEGER NOT NULL)`
);

const COOKIE = "sid";
const TTL_MS = 8 * 60 * 60 * 1000;

export type SessionData = {
  adminId?: number;
  username?: string;
  userId?: number;
  userNama?: string;
};

export function readSession(req: NextRequest): SessionData {
  const sid = req.cookies.get(COOKIE)?.value;
  if (!sid) return {};
  const row = db.prepare("SELECT data, expires FROM sessions WHERE sid = ?").get(sid) as
    | { data: string; expires: number }
    | undefined;
  if (!row || row.expires < Date.now()) return {};
  return JSON.parse(row.data);
}

export function endSession(req: NextRequest, res: NextResponse) {
  const sid = req.cookies.get(COOKIE)?.value;
  if (sid) db.prepare("DELETE FROM sessions WHERE sid = ?").run(sid);
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
}

// regenerate: hapus session lama, buat baru
export function startSession(req: NextRequest, res: NextResponse, data: SessionData) {
  const old = req.cookies.get(COOKIE)?.value;
  if (old) db.prepare("DELETE FROM sessions WHERE sid = ?").run(old);
  const sid = randomBytes(24).toString("hex");
  db.prepare("INSERT INTO sessions (sid, data, expires) VALUES (?, ?, ?)").run(
    sid,
    JSON.stringify(data),
    Date.now() + TTL_MS
  );
  res.cookies.set(COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: TTL_MS / 1000,
    secure: process.env.COOKIE_SECURE === "true",
  });
}