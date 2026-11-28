import { makeCrud } from "@/lib/adminCrud";
import { normalizeMapsUrl, MAPS_URL_ERROR } from "@/lib/maps";
import prisma from "@/lib/prisma";

// Rating & jumlah ulasan di situs utama dihitung dari ulasan yang sudah disetujui
// (lihat /api/site-content). Admin memakai perhitungan yang sama supaya angkanya sama.
async function withReviewStats<T extends { id: number }>(rows: T[], type: "store" | "menu") {
  const reviews = await prisma.testimonial.findMany({
    where: { target_type: type, approved: 1 },
    select: { target_id: true, stars: true },
  });
  const agg = new Map<number, { sum: number; n: number }>();
  reviews.forEach((r) => {
    if (r.target_id == null) return;
    const a = agg.get(r.target_id) || { sum: 0, n: 0 };
    a.sum += r.stars;
    a.n += 1;
    agg.set(r.target_id, a);
  });
  return rows.map((row) => {
    const a = agg.get(row.id);
    return { ...row, rating: a ? Math.round((a.sum / a.n) * 10) / 10 : 0, ulasan_count: a ? a.n : 0 };
  });
}

export const stores = makeCrud({
  model: "store",
  requiredField: "nama",
  decorate: (rows) => withReviewStats(rows, "store"),
  fields: [
    { name: "nama", type: "string", default: "" },
    { name: "alamat", type: "string", default: "" },
    {
      name: "maps_url", type: "string", default: "", nullable: true,
      transform: (v) => {
        const m = normalizeMapsUrl(v);
        if (m === null) throw new Error(MAPS_URL_ERROR);
        return m;
      },
    },
    { name: "jam_buka", type: "string", default: "" },
    { name: "jam_tutup", type: "string", default: "" },
    { name: "sort_order", type: "int", default: 0 },
    { name: "image_url", type: "string", default: "" },
    { name: "approval_status", type: "string", default: "approved" },
  ],
  beforeDelete: async (storeId, tx) => {
    const menuIds = (await tx.menuItem.findMany({ where: { store_id: storeId }, select: { id: true } })).map(
      (m) => m.id
    );
    if (menuIds.length) {
      await tx.testimonial.deleteMany({ where: { target_type: "menu", target_id: { in: menuIds } } });
      await tx.wishlistItem.deleteMany({ where: { item_type: "menu", item_id: { in: menuIds } } });
    }
    await tx.testimonial.deleteMany({ where: { target_type: "store", target_id: storeId } });
    await tx.wishlistItem.deleteMany({ where: { item_type: "store", item_id: storeId } });
    await tx.menuItem.deleteMany({ where: { store_id: storeId } });
    await tx.user.updateMany({ where: { store_id: storeId }, data: { store_id: null } });
  },
});

export const menu = makeCrud({
  model: "menuItem",
  requiredField: "nama",
  decorate: (rows) => withReviewStats(rows, "menu"),
  fields: [
    { name: "nama", type: "string", default: "" },
    { name: "deskripsi", type: "string", default: "" },
    { name: "harga", type: "string", default: "" },
    { name: "sort_order", type: "int", default: 0 },
    { name: "store_id", type: "int", default: null, nullable: true },
    { name: "image_url", type: "string", default: "" },
  ],
  beforeDelete: async (menuId, tx) => {
    await tx.testimonial.deleteMany({ where: { target_type: "menu", target_id: menuId } });
    await tx.wishlistItem.deleteMany({ where: { item_type: "menu", item_id: menuId } });
  },
});

export const testimonials = makeCrud({
  model: "testimonial",
  requiredField: "nama",
  fields: [
    { name: "nama", type: "string", default: "" },
    { name: "ulasan", type: "string", default: "" },
    { name: "waktu", type: "string", default: "" },
    { name: "stars", type: "int", default: 5 },
    { name: "sort_order", type: "int", default: 0 },
    { name: "approved", type: "int", default: 0 },
  ],
});

export const faqs = makeCrud({
  model: "faq",
  requiredField: "question",
  fields: [
    { name: "question", type: "string", default: "" },
    { name: "answer", type: "string", default: "" },
    { name: "sort_order", type: "int", default: 0 },
  ],
});