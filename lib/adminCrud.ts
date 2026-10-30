import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export type Field = { name: string; default: unknown; nullable?: boolean };
export type CrudConfig = {
  table: string;
  fields: Field[];
  requiredField: string;
  beforeDelete?: (id: string) => void;
};
type Ctx = { params: Promise<{ id: string }> };

function prep(val: any, def: Field) {
  if (def.nullable && val === "") val = null;
  if (Array.isArray(val)) val = JSON.stringify(val);
  return val;
}

export function makeCrud({ table, fields, requiredField, beforeDelete }: CrudConfig) {
  const cols = fields.map((f) => f.name);

  return {
    async list(req: NextRequest) {
      const deny = requireAdmin(req);
      if (deny) return deny;
      return NextResponse.json(db.prepare(`SELECT * FROM ${table} ORDER BY sort_order ASC, id ASC`).all());
    },

    async create(req: NextRequest) {
      const deny = requireAdmin(req);
      if (deny) return deny;
      const body: any = (await req.json().catch(() => ({}))) || {};
      if (!body[requiredField] || !String(body[requiredField]).trim()) {
        return NextResponse.json({ error: `${requiredField} is required.` }, { status: 400 });
      }
      const values: Record<string, any> = {};
      fields.forEach((f) => {
        values[f.name] = prep(body[f.name] !== undefined ? body[f.name] : f.default, f);
      });
      const result = db
        .prepare(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map((c) => "@" + c).join(", ")})`)
        .run(values);
      const created = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(result.lastInsertRowid);
      return NextResponse.json(created, { status: 201 });
    },

    async update(req: NextRequest, ctx: Ctx) {
      const deny = requireAdmin(req);
      if (deny) return deny;
      const { id } = await ctx.params;
      const existing: any = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
      if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const body: any = (await req.json().catch(() => ({}))) || {};
      const values: Record<string, any> = { id };
      fields.forEach((f) => {
        values[f.name] = prep(body[f.name] !== undefined ? body[f.name] : existing[f.name], f);
      });
      db.prepare(`UPDATE ${table} SET ${cols.map((c) => `${c} = @${c}`).join(", ")} WHERE id = @id`).run(values);
      return NextResponse.json(db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id));
    },

    async remove(req: NextRequest, ctx: Ctx) {
      const deny = requireAdmin(req);
      if (deny) return deny;
      const { id } = await ctx.params;
      const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
      if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });
      try {
        db.transaction(() => {
          if (beforeDelete) beforeDelete(id);
          db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
        })();
        return NextResponse.json({ ok: true });
      } catch (err: any) {
        console.error(`Gagal menghapus dari tabel ${table} (id=${id}):`, err);
        return NextResponse.json({ error: "Gagal menghapus: " + err.message }, { status: 500 });
      }
    },
  };
}