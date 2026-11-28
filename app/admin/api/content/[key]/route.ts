/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { jsonBody } from "@/lib/serialize";
import { CONTENT } from "@/lib/adminConfig";

type Ctx = { params: Promise<{ key: string }> };

// Field yang boleh diedit untuk tiap section diambil dari lib/adminConfig.ts,
// yaitu daftar yang sama dengan form di admin dan yang dibaca situs utama.
function fieldNames(key: string): string[] {
  return CONTENT[key].fields.map((f) => f.name);
}

function pick(source: Record<string, any>, names: string[]) {
  const out: Record<string, string> = {};
  names.forEach((n) => (out[n] = typeof source[n] === "string" ? source[n] : ""));
  return out;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  const { key } = await ctx.params;
  if (!CONTENT[key]) return NextResponse.json({ error: "Unknown content section." }, { status: 404 });
  const row = await prisma.contentBlock.findUnique({ where: { key } });
  const data = row ? JSON.parse(row.data) : {};
  return NextResponse.json(pick(data, fieldNames(key)));
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  const { key } = await ctx.params;
  if (!CONTENT[key]) return NextResponse.json({ error: "Unknown content section." }, { status: 404 });

  const existing = await prisma.contentBlock.findUnique({ where: { key } });
  const current: Record<string, any> = existing ? JSON.parse(existing.data) : {};
  const incoming = await jsonBody(req);

  const merged: Record<string, any> = { ...current };
  fieldNames(key).forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(incoming, field)) {
      merged[field] = String(incoming[field] ?? "");
    }
  });

  await prisma.contentBlock.upsert({
    where: { key },
    update: { data: JSON.stringify(merged) },
    create: { key, data: JSON.stringify(merged) },
  });
  return NextResponse.json(pick(merged, fieldNames(key)));
}
