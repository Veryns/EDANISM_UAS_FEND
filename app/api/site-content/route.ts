import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { flatMenu } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Agg = { sum: number; n: number };

function aggregate(rows: { target_id: number | null; stars: number }[]) {
  const agg = new Map<number, Agg>();
  rows.forEach((r) => {
    if (r.target_id == null) return;
    const a = agg.get(r.target_id) || { sum: 0, n: 0 };
    a.sum += r.stars;
    a.n += 1;
    agg.set(r.target_id, a);
  });
  return agg;
}

export async function GET() {
  const blocks = await prisma.contentBlock.findMany();
  const content: Record<string, unknown> = {};
  blocks.forEach((r) => (content[r.key] = JSON.parse(r.data)));

  // ---- Toko ----
  const rawStores = await prisma.store.findMany({
    where: { approval_status: "approved" },
    orderBy: [{ sort_order: "asc" }, { id: "asc" }],
  });
  const storeReviews = await prisma.testimonial.findMany({
    where: { target_type: "store", approved: 1 },
    select: { target_id: true, stars: true },
  });
  const storeAgg = aggregate(storeReviews);
  const stores = rawStores.map((s) => {
    const a = storeAgg.get(s.id);
    return { ...s, rating: a ? Math.round((a.sum / a.n) * 10) / 10 : 0, ulasan_count: a ? a.n : 0 };
  });

  // ---- Menu (rating dari ulasan menu yang sudah disetujui) ----
  const menuReviews = await prisma.testimonial.findMany({
    where: { target_type: "menu", approved: 1 },
    select: { target_id: true, stars: true },
  });
  const menuAgg = aggregate(menuReviews);

  const menu = (
    await prisma.menuItem.findMany({
      where: { OR: [{ store_id: null }, { store: { is: { approval_status: "approved" } } }] },
      include: { store: true },
      orderBy: [{ sort_order: "asc" }, { id: "asc" }],
    })
  )
    .map(flatMenu)
    .map((m) => {
      const a = menuAgg.get(m.id);
      return { ...m, rating: a ? Math.round((a.sum / a.n) * 10) / 10 : 0, ulasan_count: a ? a.n : 0 };
    })
    // Menu Unggulan: rating tertinggi dulu, lalu yang ulasannya lebih banyak,
    // lalu urutan bawaan (sort_order, id)
    .sort(
      (x, y) =>
        y.rating - x.rating ||
        y.ulasan_count - x.ulasan_count ||
        x.sort_order - y.sort_order ||
        x.id - y.id
    );

  const testimonials = await prisma.testimonial.findMany({
    where: { approved: 1 },
    orderBy: [{ sort_order: "asc" }, { id: "asc" }],
  });
  const faqs = await prisma.faq.findMany({ orderBy: [{ sort_order: "asc" }, { id: "asc" }] });

  return NextResponse.json({ content, stores, menu, testimonials, faqs });
}