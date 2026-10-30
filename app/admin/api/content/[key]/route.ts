import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const ALLOWED = [
  "site", "hero", "toko_populer", "menu_section", "about", "history",
  "testimonial_section", "cari_toko", "faq_section", "contact", "footer",
];
type Ctx = { params: Promise<{ key: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  const { key } = await ctx.params;
  if (!ALLOWED.includes(key)) return NextResponse.json({ error: "Unknown content section." }, { status: 404 });
  const row = db.prepare("SELECT data FROM content_blocks WHERE key = ?").get(key) as any;
  if (!row) return NextResponse.json({ error: "Content section not found." }, { status: 404 });
  const data = JSON.parse(row.data);
  if (key === "about" && data.images === undefined) {
    data.images = data.image_url ? [data.image_url] : [];
  }
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  const { key } = await ctx.params;
  if (!ALLOWED.includes(key)) return NextResponse.json({ error: "Unknown content section." }, { status: 404 });
  const existing = db.prepare("SELECT data FROM content_blocks WHERE key = ?").get(key) as any;
  if (!existing) return NextResponse.json({ error: "Content section not found." }, { status: 404 });

  const current = JSON.parse(existing.data);
  const incoming: any = (await req.json().catch(() => ({}))) || {};
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

  db.prepare("UPDATE content_blocks SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?").run(
    JSON.stringify(merged),
    key
  );
  return NextResponse.json(merged);
}