import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { flatMenu } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  const blocks = await prisma.contentBlock.findMany();
  const content: Record<string, unknown> = {};
  blocks.forEach((r) => (content[r.key] = JSON.parse(r.data)));

  const rawStores = await prisma.store.findMany({
    where: { approval_status: "approved" },
    orderBy: [{ sort_order: "asc" }, { id: "asc" }],
  });
  const reviews = await prisma.testimonial.findMany({
    where: { target_type: "store", approved: 1 },
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
  const stores = rawStores.map((s) => {
    const a = agg.get(s.id);
    return { ...s, rating: a ? Math.round((a.sum / a.n) * 10) / 10 : 0, ulasan_count: a ? a.n : 0 };
  });

  const menu = (
    await prisma.menuItem.findMany({
      where: { OR: [{ store_id: null }, { store: { is: { approval_status: "approved" } } }] },
      include: { store: true },
      orderBy: [{ sort_order: "asc" }, { id: "asc" }],
    })
  ).map(flatMenu);

  const testimonials = await prisma.testimonial.findMany({
    where: { approved: 1 },
    orderBy: [{ sort_order: "asc" }, { id: "asc" }],
  });
  const faqs = await prisma.faq.findMany({ orderBy: [{ sort_order: "asc" }, { id: "asc" }] });

  return NextResponse.json({ content, stores, menu, testimonials, faqs });
}