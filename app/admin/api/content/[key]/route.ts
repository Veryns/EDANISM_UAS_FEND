/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { jsonBody } from "@/lib/serialize";

const ALLOWED = [
  "site", "hero", "toko_populer", "menu_section", "about", "history",
  "testimonial_section", "cari_toko", "faq_section", "contact", "footer",
];
type Ctx = { params: Promise<{ key: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  const { key } = await ctx.params;
  if (!ALLOWED.includes(key)) return NextResponse.json({ error: "Unknown content section." }, { status: 404 });
  const row = await prisma.contentBlock.findUnique({ where: { key } });
  if (!row) return NextResponse.json({ error: "Content section not found." }, { status: 404 });
  const data = JSON.parse(row.data);
  if (key === "about" && data.images === undefined) {
    data.images = data.image_url ? [data.image_url] : [];
  }
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const deny = await requireAdmin(req);
  if (deny) return deny;
  const { key } = await ctx.params;
  if (!ALLOWED.includes(key)) return NextResponse.json({ error: "Unknown content section." }, { status: 404 });
  const existing = await prisma.contentBlock.findUnique({ where: { key } });
  if (!existing) return NextResponse.json({ error: "Content section not found." }, { status: 404 });

  const current = JSON.parse(existing.data);
  const incoming = await jsonBody(req);
  const merged: Record<string, any> = { ...current };
  const fields = Object.keys(current);
  if (key === "about" && !fields.includes("images")) fields.push("images");

  fields.forEach((field) => {
    if (!Object.prototype.hasOwnProperty.call(incoming, field)) return;
    if (field === "images") {
      const value = incoming[field];
      if (Array.isArray(value)) {
        merged[field] = value.filter((i: unknown) => typeof i === "string" && i);
      } else if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          merged[field] = Array.isArray(parsed) ? parsed : value ? [value] : [];
        } catch {
          merged[field] = value ? [value] : [];
        }
      } else {
        merged[field] = [];
      }
    } else {
      merged[field] = String(incoming[field] ?? "");
    }
  });

  await prisma.contentBlock.update({ where: { key }, data: { data: JSON.stringify(merged) } });
  return NextResponse.json(merged);
}