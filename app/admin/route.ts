import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { readSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  if (!(await readSession(req)).adminId) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  const html = await readFile(path.join(process.cwd(), "private", "admin", "dashboard.html"), "utf8");
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}