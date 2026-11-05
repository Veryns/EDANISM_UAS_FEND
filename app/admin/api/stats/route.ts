import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { addDays, dayKey } from "@/lib/day";

export const dynamic = "force-dynamic";

const MAX_DAYS = 1500;

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const today = dayKey();
  const [
    usersByRole, usersByStatus, userDates, storesByApproval, storeFirst, menuFirst,
    menuCount, testimonialTotal, testimonialPending, faqCount,
    wishlistDates, wishlistUsers, wishByItem, visitsByDay, visitorIds, firstVisit,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.user.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.user.findMany({ select: { created_at: true } }),
    prisma.store.groupBy({ by: ["approval_status"], _count: { _all: true } }),
    prisma.store.findFirst({ orderBy: { created_at: "asc" }, select: { created_at: true } }),
    prisma.menuItem.findFirst({ orderBy: { created_at: "asc" }, select: { created_at: true } }),
    prisma.menuItem.count(),
    prisma.testimonial.count(),
    prisma.testimonial.count({ where: { approved: 0 } }),
    prisma.faq.count(),
    prisma.wishlistItem.findMany({ select: { created_at: true } }),
    prisma.wishlistItem.groupBy({ by: ["user_id"] }),
    prisma.wishlistItem.groupBy({ by: ["item_type", "item_id"], _count: { _all: true } }),
    prisma.siteVisit.groupBy({ by: ["day"], _count: { _all: true } }),
    prisma.siteVisit.findMany({ select: { visitor_id: true, day: true } }),
    prisma.siteVisit.findFirst({ orderBy: { day: "asc" }, select: { day: true } }),
  ]);

  // ---- Deret waktu harian, dari hari paling awal website punya data ----
  const candidates: string[] = [today];
  for (const d of userDates) candidates.push(dayKey(d.created_at));
  for (const d of wishlistDates) candidates.push(dayKey(d.created_at));
  if (storeFirst) candidates.push(dayKey(storeFirst.created_at));
  if (menuFirst) candidates.push(dayKey(menuFirst.created_at));
  if (firstVisit) candidates.push(firstVisit.day);
  let start = candidates.reduce((a, b) => (a < b ? a : b));
  const earliestAllowed = addDays(today, -(MAX_DAYS - 1));
  if (start < earliestAllowed) start = earliestAllowed;

  const reg = new Map<string, number>();
  for (const u of userDates) {
    const k = dayKey(u.created_at);
    reg.set(k, (reg.get(k) ?? 0) + 1);
  }
  const wish = new Map<string, number>();
  for (const w of wishlistDates) {
    const k = dayKey(w.created_at);
    wish.set(k, (wish.get(k) ?? 0) + 1);
  }
  const vis = new Map<string, number>(visitsByDay.map((v) => [v.day, v._count._all]));

  // akun/wishlist yang dibuat sebelum 'start' (jika deret dipotong) tetap dihitung di total kumulatif
  let accounts = userDates.filter((u) => dayKey(u.created_at) < start).length;
  let wishCum = wishlistDates.filter((w) => dayKey(w.created_at) < start).length;
  const series: { date: string; visitors: number; registrations: number; accounts: number; wishlist: number; wishlistTotal: number }[] = [];
  for (let d = start; d <= today; d = addDays(d, 1)) {
    const r = reg.get(d) ?? 0;
    const w = wish.get(d) ?? 0;
    accounts += r;
    wishCum += w;
    series.push({ date: d, visitors: vis.get(d) ?? 0, registrations: r, accounts, wishlist: w, wishlistTotal: wishCum });
  }

  // ---- Pengunjung unik ----
  const since = (n: number) => addDays(today, -(n - 1));
  const uniq = (from: string) => new Set(visitorIds.filter((v) => v.day >= from).map((v) => v.visitor_id)).size;
  const visitors = {
    trackingSince: firstVisit?.day ?? null,
    today: vis.get(today) ?? 0,
    last7: uniq(since(7)),
    last30: uniq(since(30)),
    allTime: new Set(visitorIds.map((v) => v.visitor_id)).size,
    visitDays: visitorIds.length,
  };

  // ---- Ringkasan akun ----
  const role = (r: string) => usersByRole.find((x) => x.role === r)?._count._all ?? 0;
  const totalUsers = usersByRole.reduce((n, x) => n + x._count._all, 0);
  const count7 = series.slice(-7).reduce((n, d) => n + d.registrations, 0);
  const count30 = series.slice(-30).reduce((n, d) => n + d.registrations, 0);
  const store = (s: string) => storesByApproval.find((x) => x.approval_status === s)?._count._all ?? 0;

  // ---- Wishlist per toko / menu ----
  const storeCounts = new Map<number, number>();
  const menuCounts = new Map<number, number>();
  for (const w of wishByItem) {
    (w.item_type === "store" ? storeCounts : menuCounts).set(w.item_id, w._count._all);
  }
  const [stores, menus] = await Promise.all([
    prisma.store.findMany({ select: { id: true, nama: true } }),
    prisma.menuItem.findMany({ select: { id: true, nama: true, store_id: true, store: { select: { nama: true } } } }),
  ]);
  const storeRows = stores.map((s) => {
    const direct = storeCounts.get(s.id) ?? 0;
    const viaMenu = menus
      .filter((m) => m.store_id === s.id)
      .reduce((n, m) => n + (menuCounts.get(m.id) ?? 0), 0);
    return { id: s.id, nama: s.nama, wishlist_toko: direct, wishlist_menu: viaMenu, total: direct + viaMenu };
  });
  const menuRows = menus.map((m) => ({
    id: m.id, nama: m.nama, store_nama: m.store?.nama ?? null, total: menuCounts.get(m.id) ?? 0,
  }));
  const byTotalDesc = <T extends { total: number; nama: string }>(a: T, b: T) =>
    b.total - a.total || a.nama.localeCompare(b.nama);

  return NextResponse.json({
    start,
    today,
    series,
    visitors,
    users: {
      total: totalUsers,
      pembeli: role("user"),
      toko: role("toko"),
      pending: usersByStatus.find((x) => x.status === "pending")?._count._all ?? 0,
      baru7: count7,
      baru30: count30,
    },
    stores: {
      total: stores.length,
      approved: store("approved"),
      pending: store("pending"),
      rejected: store("rejected"),
    },
    content: { menu: menuCount, testimoni: testimonialTotal, testimoniPending: testimonialPending, faq: faqCount },
    wishlist: {
      total: wishlistDates.length,
      users: wishlistUsers.length,
      toko: [...storeCounts.values()].reduce((a, b) => a + b, 0),
      menu: [...menuCounts.values()].reduce((a, b) => a + b, 0),
      perToko: storeRows.sort(byTotalDesc),
      perMenu: menuRows.sort(byTotalDesc),
    },
  });
}
