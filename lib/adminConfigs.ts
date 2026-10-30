import db from "@/lib/db";
import { makeCrud } from "@/lib/adminCrud";

export const stores = makeCrud({
  table: "stores",
  requiredField: "nama",
  fields: [
    { name: "nama", default: "" },
    { name: "alamat", default: "" },
    { name: "jam_buka", default: "" },
    { name: "jam_tutup", default: "" },
    { name: "rating", default: 0 },
    { name: "ulasan_count", default: 0 },
    { name: "sort_order", default: 0 },
    { name: "image_url", default: "" },
    { name: "approval_status", default: "approved" },
  ],
  beforeDelete: (storeId) => {
    const menuIds = (db.prepare("SELECT id FROM menu_items WHERE store_id = ?").all(storeId) as any[]).map(
      (m) => m.id
    );
    if (menuIds.length) {
      const ph = menuIds.map(() => "?").join(",");
      db.prepare(`DELETE FROM testimonials WHERE target_type = 'menu' AND target_id IN (${ph})`).run(...menuIds);
    }
    db.prepare("DELETE FROM testimonials WHERE target_type = 'store' AND target_id = ?").run(storeId);
    db.prepare("DELETE FROM menu_items WHERE store_id = ?").run(storeId);
    db.prepare("UPDATE users SET store_id = NULL WHERE store_id = ?").run(storeId);
  },
});

export const menu = makeCrud({
  table: "menu_items",
  requiredField: "nama",
  fields: [
    { name: "nama", default: "" },
    { name: "deskripsi", default: "" },
    { name: "harga", default: "" },
    { name: "sort_order", default: 0 },
    { name: "store_id", default: null, nullable: true },
    { name: "image_url", default: "" },
  ],
  beforeDelete: (menuId) => {
    db.prepare("DELETE FROM testimonials WHERE target_type = 'menu' AND target_id = ?").run(menuId);
  },
});

export const testimonials = makeCrud({
  table: "testimonials",
  requiredField: "nama",
  fields: [
    { name: "nama", default: "" },
    { name: "ulasan", default: "" },
    { name: "waktu", default: "" },
    { name: "stars", default: 5 },
    { name: "sort_order", default: 0 },
    { name: "approved", default: 0 },
  ],
});

export const faqs = makeCrud({
  table: "faqs",
  requiredField: "question",
  fields: [
    { name: "question", default: "" },
    { name: "answer", default: "" },
    { name: "sort_order", default: 0 },
  ],
});