import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

type ColType = "int" | "float" | "str" | "date" | "bigint";
type Rel = { model: string; kind: "one" | "many"; fk: string };
type Model = {
  table: string;
  cols: Record<string, ColType>;
  defaults?: Record<string, unknown>;
  rels?: Record<string, Rel>;
  updatedAt?: string;
};

const MODELS: Record<string, Model> = {
  adminUser: {
    table: "admin_users",
    cols: { id: "int", username: "str", password_hash: "str", created_at: "date" },
  },
  user: {
    table: "users",
    cols: { id: "int", nama: "str", email: "str", password_hash: "str", role: "str", status: "str", store_id: "int", created_at: "date" },
    defaults: { role: "user", status: "approved", store_id: null },
    rels: {
      store: { model: "store", kind: "one", fk: "store_id" },
      wishlist: { model: "wishlistItem", kind: "many", fk: "user_id" },
    },
  },
  store: {
    table: "stores",
    cols: { id: "int", nama: "str", alamat: "str", maps_url: "str", jam_buka: "str", jam_tutup: "str", rating: "float", ulasan_count: "int", sort_order: "int", image_url: "str", approval_status: "str", created_at: "date" },
    defaults: { alamat: null, maps_url: null, jam_buka: null, jam_tutup: null, rating: 0, ulasan_count: 0, sort_order: 0, image_url: null, approval_status: "approved" },
    rels: {
      menus: { model: "menuItem", kind: "many", fk: "store_id" },
      users: { model: "user", kind: "many", fk: "store_id" },
    },
  },
  menuItem: {
    table: "menu_items",
    cols: { id: "int", nama: "str", deskripsi: "str", harga: "str", sort_order: "int", image_url: "str", store_id: "int", created_at: "date" },
    defaults: { deskripsi: null, harga: null, sort_order: 0, image_url: null, store_id: null },
    rels: { store: { model: "store", kind: "one", fk: "store_id" } },
  },
  testimonial: {
    table: "testimonials",
    cols: { id: "int", nama: "str", ulasan: "str", waktu: "str", stars: "int", sort_order: "int", approved: "int", target_type: "str", target_id: "int", target_nama: "str", created_at: "date" },
    defaults: { ulasan: null, waktu: null, stars: 5, sort_order: 0, approved: 0, target_type: null, target_id: null, target_nama: null },
  },
  faq: {
    table: "faqs",
    cols: { id: "int", question: "str", answer: "str", sort_order: "int", created_at: "date" },
    defaults: { answer: null, sort_order: 0 },
  },
  wishlistItem: {
    table: "wishlist_items",
    cols: { id: "int", user_id: "int", item_type: "str", item_id: "int", created_at: "date" },
    rels: { user: { model: "user", kind: "one", fk: "user_id" } },
  },
  contentBlock: {
    table: "content_blocks",
    cols: { key: "str", data: "str", updated_at: "date" },
    updatedAt: "updated_at",
  },
  session: {
    table: "sessions",
    cols: { sid: "str", data: "str", expires: "bigint" },
  },
  siteVisit: {
    table: "site_visits",
    cols: { id: "int", visitor_id: "str", day: "str", user_id: "int", created_at: "date" },
    defaults: { user_id: null },
  },
};

const q = (s: string) => `"${s}"`;
const isPlain = (v: any) => v !== null && typeof v === "object" && !(v instanceof Date) && !Array.isArray(v) && typeof v !== "bigint";

function toDb(v: any): any {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "boolean") return v ? 1 : 0;
  return v;
}

function fromDb(type: ColType, v: any): any {
  if (v === null || v === undefined) return null;
  if (type === "date") return new Date(v);
  if (type === "bigint") return BigInt(v);
  return v;
}

export function createLocalDb(url: string) {
  const file = path.resolve(process.cwd(), url.replace(/^file:/, ""));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(fs.readFileSync(path.join(process.cwd(), "db", "schema.sqlite.sql"), "utf8"));

  const pkOf = (m: Model) => (m.cols.id ? "id" : Object.keys(m.cols)[0]);

  // ---------- WHERE ----------
  function where(name: string, w: any, params: any[], alias = ""): string {
    const m = MODELS[name];
    const col = (c: string) => (alias ? `${alias}.${q(c)}` : q(c));
    if (!w || Object.keys(w).length === 0) return "1=1";
    const parts: string[] = [];
    for (const [key, val] of Object.entries<any>(w)) {
      if (val === undefined) continue;
      if (key === "AND" || key === "OR") {
        const arr = (Array.isArray(val) ? val : [val]).map((x) => where(name, x, params, alias));
        if (arr.length) parts.push(`(${arr.join(key === "AND" ? " AND " : " OR ")})`);
      } else if (key === "NOT") {
        parts.push(`NOT (${where(name, val, params, alias)})`);
      } else if (m.cols[key]) {
        parts.push(cond(col(key), val, params));
      } else if (m.rels?.[key]) {
        const r = m.rels[key];
        const t = MODELS[r.model];
        if (r.kind === "one") {
          const isFilter = val && ("is" in val || "isNot" in val) ? val : { is: val };
          if ("is" in isFilter && isFilter.is) {
            parts.push(`${col(r.fk)} IN (SELECT ${q(pkOf(t))} FROM ${q(t.table)} WHERE ${where(r.model, isFilter.is, params)})`);
          }
          if ("isNot" in isFilter) {
            if (isFilter.isNot === null) parts.push(`${col(r.fk)} IS NOT NULL`);
            else parts.push(`(${col(r.fk)} IS NULL OR ${col(r.fk)} NOT IN (SELECT ${q(pkOf(t))} FROM ${q(t.table)} WHERE ${where(r.model, isFilter.isNot, params)}))`);
          }
        } else {
          const sub = val.some ?? val;
          parts.push(`${col(pkOf(m))} IN (SELECT ${q(r.fk)} FROM ${q(t.table)} WHERE ${where(r.model, sub, params)})`);
        }
      } else if (isPlain(val)) {
        // kunci unik gabungan, mis. user_id_item_type_item_id: { user_id, item_type, item_id }
        parts.push(where(name, val, params, alias));
      } else {
        throw new Error(`localdb: field "${key}" tidak dikenal di model ${name}`);
      }
    }
    return parts.length ? parts.join(" AND ") : "1=1";
  }

  function cond(c: string, val: any, params: any[]): string {
    if (val === null) return `${c} IS NULL`;
    if (!isPlain(val)) {
      params.push(toDb(val));
      return `${c} = ?`;
    }
    const out: string[] = [];
    for (const [op, v] of Object.entries<any>(val)) {
      if (v === undefined || op === "mode") continue;
      if (op === "equals") out.push(v === null ? `${c} IS NULL` : (params.push(toDb(v)), `${c} = ?`));
      else if (op === "not") out.push(v === null ? `${c} IS NOT NULL` : (params.push(toDb(v)), `(${c} IS NULL OR ${c} <> ?)`));
      else if (op === "in") {
        if (!v.length) out.push("0");
        else { params.push(...v.map(toDb)); out.push(`${c} IN (${v.map(() => "?").join(",")})`); }
      } else if (op === "notIn") {
        if (v.length) { params.push(...v.map(toDb)); out.push(`${c} NOT IN (${v.map(() => "?").join(",")})`); }
      } else if (op === "contains") { params.push(`%${v}%`); out.push(`${c} LIKE ?`); }
      else if (op === "startsWith") { params.push(`${v}%`); out.push(`${c} LIKE ?`); }
      else if (op === "endsWith") { params.push(`%${v}`); out.push(`${c} LIKE ?`); }
      else if (op === "lt") { params.push(toDb(v)); out.push(`${c} < ?`); }
      else if (op === "lte") { params.push(toDb(v)); out.push(`${c} <= ?`); }
      else if (op === "gt") { params.push(toDb(v)); out.push(`${c} > ?`); }
      else if (op === "gte") { params.push(toDb(v)); out.push(`${c} >= ?`); }
      else throw new Error(`localdb: operator "${op}" belum didukung`);
    }
    return out.length ? `(${out.join(" AND ")})` : "1=1";
  }

  function orderBy(name: string, ob: any): string {
    if (!ob) return "";
    const list = Array.isArray(ob) ? ob : [ob];
    const parts: string[] = [];
    for (const o of list) for (const [k, dir] of Object.entries<any>(o)) {
      if (!MODELS[name].cols[k]) throw new Error(`localdb: orderBy "${k}" tidak dikenal`);
      parts.push(`${q(k)} ${String(dir).toLowerCase() === "desc" ? "DESC" : "ASC"}`);
    }
    return parts.length ? ` ORDER BY ${parts.join(", ")}` : "";
  }

  // ---------- baca baris ----------
  function shape(name: string, row: any, opts: { select?: any; include?: any }): any {
    const m = MODELS[name];
    const out: any = {};
    const sel = opts.select;
    for (const c of Object.keys(m.cols)) {
      if (sel && !sel[c]) continue;
      out[c] = fromDb(m.cols[c], row[c]);
    }
    const relOpts: Record<string, any> = {};
    if (sel) for (const k of Object.keys(sel)) if (m.rels?.[k] && sel[k]) relOpts[k] = sel[k];
    if (opts.include) for (const k of Object.keys(opts.include)) if (m.rels?.[k] && opts.include[k]) relOpts[k] = opts.include[k];
    for (const [k, ro] of Object.entries<any>(relOpts)) {
      const r = m.rels![k];
      const t = MODELS[r.model];
      const sub = ro === true ? {} : ro;
      if (r.kind === "one") {
        const fk = row[r.fk];
        out[k] = fk == null ? null : findFirst(r.model, { where: { [pkOf(t)]: fk }, select: sub.select, include: sub.include });
      } else {
        out[k] = findMany(r.model, { where: { [r.fk]: row[pkOf(m)] }, select: sub.select, include: sub.include, orderBy: sub.orderBy });
      }
    }
    return out;
  }

  function findMany(name: string, a: any = {}): any[] {
    const m = MODELS[name];
    const params: any[] = [];
    let sql = `SELECT * FROM ${q(m.table)} WHERE ${where(name, a.where, params)}${orderBy(name, a.orderBy)}`;
    if (a.take !== undefined) { sql += ` LIMIT ${Number(a.take)}`; if (a.skip) sql += ` OFFSET ${Number(a.skip)}`; }
    else if (a.skip) sql += ` LIMIT -1 OFFSET ${Number(a.skip)}`;
    return db.prepare(sql).all(...params).map((r: any) => shape(name, r, a));
  }
  function findFirst(name: string, a: any = {}): any {
    return findMany(name, { ...a, take: 1 })[0] ?? null;
  }

  // ---------- tulis ----------
  function insert(name: string, data: any): any {
    const m = MODELS[name];
    const row: Record<string, any> = {};
    for (const [k, v] of Object.entries<any>(data)) {
      if (v === undefined) continue;
      if (m.rels?.[k]) {
        const r = m.rels[k];
        if (r.kind === "one" && v?.create) {
          const created = insert(r.model, v.create);
          row[r.fk] = created[pkOf(MODELS[r.model])];
        } else if (r.kind === "one" && v?.connect) {
          row[r.fk] = Object.values<any>(v.connect)[0];
        }
        continue;
      }
      if (!m.cols[k]) throw new Error(`localdb: field "${k}" tidak dikenal di model ${name}`);
      row[k] = toDb(v);
    }
    for (const [k, v] of Object.entries(m.defaults ?? {})) if (!(k in row)) row[k] = v;
    if (m.cols.created_at && !row.created_at) row.created_at = new Date().toISOString();
    if (m.updatedAt && !row[m.updatedAt]) row[m.updatedAt] = new Date().toISOString();
    const keys = Object.keys(row);
    const info = db
      .prepare(`INSERT INTO ${q(m.table)} (${keys.map(q).join(",")}) VALUES (${keys.map(() => "?").join(",")})`)
      .run(...keys.map((k) => (m.cols[k] === "bigint" && row[k] != null ? BigInt(row[k]) : row[k])));
    const pk = pkOf(m);
    const id = m.cols[pk] === "int" ? info.lastInsertRowid : row[pk];
    return findFirst(name, { where: { [pk]: typeof id === "bigint" ? Number(id) : id } });
  }

  function update(name: string, a: any, many: boolean): any {
    const m = MODELS[name];
    const sets: string[] = [];
    const vals: any[] = [];
    for (const [k, v] of Object.entries<any>(a.data ?? {})) {
      if (v === undefined) continue;
      if (!m.cols[k]) throw new Error(`localdb: field "${k}" tidak dikenal di model ${name}`);
      sets.push(`${q(k)} = ?`);
      vals.push(m.cols[k] === "bigint" && v != null ? BigInt(v) : toDb(v));
    }
    if (m.updatedAt && !(m.updatedAt in (a.data ?? {}))) { sets.push(`${q(m.updatedAt)} = ?`); vals.push(new Date().toISOString()); }
    const params: any[] = [];
    const w = where(name, a.where, params);
    const target = many ? null : findFirst(name, { where: a.where });
    if (!many && !target) throw new Error(`localdb: data ${name} tidak ditemukan untuk di-update`);
    const info = sets.length ? db.prepare(`UPDATE ${q(m.table)} SET ${sets.join(", ")} WHERE ${w}`).run(...vals, ...params) : null;
    if (many) return { count: info?.changes ?? 0 };
    return findFirst(name, { where: { [pkOf(m)]: target[pkOf(m)] } });
  }

  function remove(name: string, a: any, many: boolean): any {
    const m = MODELS[name];
    const target = many ? null : findFirst(name, { where: a.where });
    if (!many && !target) throw new Error(`localdb: data ${name} tidak ditemukan untuk dihapus`);
    const params: any[] = [];
    const info = db.prepare(`DELETE FROM ${q(m.table)} WHERE ${where(name, a.where, params)}`).run(...params);
    return many ? { count: info.changes } : target;
  }

  function delegate(name: string) {
    const m = MODELS[name];
    return {
      findMany: async (a?: any) => findMany(name, a),
      findFirst: async (a?: any) => findFirst(name, a),
      findUnique: async (a?: any) => findFirst(name, a),
      count: async (a?: any) => {
        const params: any[] = [];
        return (db.prepare(`SELECT COUNT(*) c FROM ${q(m.table)} WHERE ${where(name, a?.where, params)}`).get(...params) as any).c;
      },
      groupBy: async (a: any) => {
        const params: any[] = [];
        const by: string[] = a.by;
        const rows = db
          .prepare(`SELECT ${by.map(q).join(",")}, COUNT(*) AS _n FROM ${q(m.table)} WHERE ${where(name, a.where, params)} GROUP BY ${by.map(q).join(",")}`)
          .all(...params) as any[];
        return rows.map((r) => {
          const o: any = {};
          by.forEach((b) => (o[b] = fromDb(m.cols[b], r[b])));
          if (a._count) o._count = { _all: r._n };
          return o;
        });
      },
      create: async (a: any) => insert(name, a.data),
      createMany: async (a: any) => {
        let count = 0;
        for (const d of a.data) {
          try { insert(name, d); count++; }
          catch (e: any) { if (!(a.skipDuplicates && /UNIQUE/.test(String(e?.message)))) throw e; }
        }
        return { count };
      },
      update: async (a: any) => update(name, a, false),
      updateMany: async (a: any) => update(name, a, true),
      upsert: async (a: any) => {
        const found = findFirst(name, { where: a.where });
        return found ? update(name, { where: a.where, data: a.update }, false) : insert(name, a.create);
      },
      delete: async (a: any) => remove(name, a, false),
      deleteMany: async (a: any) => remove(name, a ?? {}, true),
    };
  }

  const client: any = {};
  for (const name of Object.keys(MODELS)) client[name] = delegate(name);
  client.$disconnect = async () => db.close();
  // Bentuk array: setiap operasi sudah langsung dijalankan saat dipanggil (sinkron),
  // jadi cukup ditunggu semuanya. Bentuk callback: dibungkus transaksi SQLite.
  client.$transaction = async (arg: any) => {
    if (Array.isArray(arg)) return Promise.all(arg);
    db.exec("BEGIN");
    try {
      const res = await arg(client);
      db.exec("COMMIT");
      return res;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  };
  return client;
}
