import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const content: Record<string, unknown> = {};
  (db.prepare("SELECT key, data FROM content_blocks").all() as any[]).forEach((r) => {
    content[r.key] = JSON.parse(r.data);
  });

  const stores = db
    .prepare(
      `SELECT
         stores.*,
         ROUND(COALESCE(AVG(testimonials.stars), 0), 1) AS rating,
         COUNT(testimonials.id) AS ulasan_count
       FROM stores
       LEFT JOIN testimonials
         ON testimonials.target_type = 'store'
         AND testimonials.target_id = stores.id
         AND testimonials.approved = 1
       WHERE stores.approval_status = 'approved'
       GROUP BY stores.id
       ORDER BY stores.sort_order ASC, stores.id ASC`
    )
    .all();

  const menu = db
    .prepare(
      `SELECT menu_items.*, stores.id AS store_id, stores.nama AS store_nama, stores.alamat AS store_alamat
       FROM menu_items
       LEFT JOIN stores ON stores.id = menu_items.store_id
       WHERE stores.id IS NULL OR stores.approval_status = 'approved'
       ORDER BY menu_items.sort_order ASC, menu_items.id ASC`
    )
    .all();

  const testimonials = db
    .prepare("SELECT * FROM testimonials WHERE approved = 1 ORDER BY sort_order ASC, id ASC")
    .all();
  const faqs = db.prepare("SELECT * FROM faqs ORDER BY sort_order ASC, id ASC").all();

  return NextResponse.json({ content, stores, menu, testimonials, faqs });
}