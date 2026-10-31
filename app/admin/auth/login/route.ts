import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { startSession } from "@/lib/session";
import { rlBlocked, rlHit } from "@/lib/rateLimit";
import { jsonBody } from "@/lib/serialize";

const WINDOW = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  if (rlBlocked(req, "admin-login", 10)) {
    return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
  }
  const { username, password } = await jsonBody(req);
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const fail = () => {
    rlHit(req, "admin-login", WINDOW);
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  };

  const user = await prisma.adminUser.findUnique({ where: { username: String(username) } });
  if (!user) return fail();
  if (!(await bcrypt.compare(String(password), user.password_hash))) return fail();

  const res = NextResponse.json({ ok: true, redirect: "/admin" });
  await startSession(req, res, { adminId: user.id, username: user.username });
  return res;
}