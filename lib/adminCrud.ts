/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export type Tx = Prisma.TransactionClient;
export type Field = {
  name: string;
  type: "string" | "int" | "float";
  default: unknown;
  nullable?: boolean;
};
export type CrudConfig = {
  model: "store" | "menuItem" | "testimonial" | "faq";
  fields: Field[];
  requiredField: string;
  beforeDelete?: (id: number, tx: Tx) => Promise<void>;
};
type Ctx = { params: Promise<{ id: string }> };

function coerce(val: any, f: Field) {
  if (val === undefined) val = f.default;
  if (f.nullable && (val === "" || val === null || val === undefined)) return null;
  if (f.type === "string") {
    if (val === null || val === undefined) return "";
    return Array.isArray(val) ? JSON.stringify(val) : String(val);
  }
  const n = Number(val);
  if (Number.isNaN(n)) return Number(f.default) || 0;
  return f.type === "int" ? Math.trunc(n) : n;
}

export function makeCrud({ model, fields, requiredField, beforeDelete }: CrudConfig) {
  const d = () => (prisma as any)[model];

  return {
    async list(req: NextRequest) {
      const deny = await requireAdmin(req);
      if (deny) return deny;
      const rows = await d().findMany({ orderBy: [{ sort_order: "asc" }, { id: "asc" }] });
      return NextResponse.json(rows);
    },

    async create(req: NextRequest) {
      const deny = await requireAdmin(req);
      if (deny) return deny;
      const body: any = (await req.json().catch(() => ({}))) || {};
      if (!body[requiredField] || !String(body[requiredField]).trim()) {
        return NextResponse.json({ error: `${requiredField} is required.` }, { status: 400 });
      }
      const data: Record<string, unknown> = {};
      fields.forEach((f) => (data[f.name] = coerce(body[f.name], f)));
      const created = await d().create({ data });
      return NextResponse.json(created, { status: 201 });
    },

    async update(req: NextRequest, ctx: Ctx) {
      const deny = await requireAdmin(req);
      if (deny) return deny;
      const id = Number((await ctx.params).id);
      if (!Number.isInteger(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const existing = await d().findUnique({ where: { id } });
      if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const body: any = (await req.json().catch(() => ({}))) || {};
      const data: Record<string, unknown> = {};
      fields.forEach((f) => {
        if (body[f.name] !== undefined) data[f.name] = coerce(body[f.name], f);
      });
      const updated = await d().update({ where: { id }, data });
      return NextResponse.json(updated);
    },

    async remove(req: NextRequest, ctx: Ctx) {
      const deny = await requireAdmin(req);
      if (deny) return deny;
      const id = Number((await ctx.params).id);
      if (!Number.isInteger(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const existing = await d().findUnique({ where: { id } });
      if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });
      try {
        await prisma.$transaction(async (tx) => {
          if (beforeDelete) await beforeDelete(id, tx);
          await (tx as any)[model].delete({ where: { id } });
        });
        return NextResponse.json({ ok: true });
      } catch (err: any) {
        console.error(`Gagal menghapus ${model} (id=${id}):`, err);
        return NextResponse.json({ error: "Gagal menghapus: " + err.message }, { status: 500 });
      }
    },
  };
}