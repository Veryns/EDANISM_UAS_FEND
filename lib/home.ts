export type Store = {
  id: number;
  nama: string;
  alamat?: string;
  jam_buka?: string;
  jam_tutup?: string;
  rating: number;
  image_url?: string;
};
export type MenuItem = {
  id: number;
  nama: string;
  deskripsi?: string;
  harga?: string;
  image_url?: string;
  store_id?: number | null;
  store_nama?: string;
  store_alamat?: string;
};
export type Testimonial = {
  id: number;
  nama: string;
  ulasan: string;
  waktu: string;
  stars: number;
  target_type?: string;
  target_nama?: string;
};
export type Faq = { id: number; question: string; answer: string };
export type Content = Record<string, Record<string, string | string[] | undefined>>;
export type SiteData = {
  content: Content;
  stores: Store[];
  menu: MenuItem[];
  testimonials: Testimonial[];
  faqs: Faq[];
};
export type User = { nama: string; email: string; role?: string };

export function txt(content: Content, path: string, fallback: string): string {
  const [block, key] = path.split(".");
  const v = content[block]?.[key];
  return typeof v === "string" && v !== "" ? v : fallback;
}

export function imageList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(Boolean) as string[];
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {}
  return [value];
}

function timeToMinutes(value?: string): number | null {
  const m = String(value || "").match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export function storeIsOpen(store: Store, now: Date): boolean {
  const open = timeToMinutes(store.jam_buka);
  const close = timeToMinutes(store.jam_tutup);
  if (open === null || close === null || open === close) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  return open < close ? cur >= open && cur < close : cur >= open || cur < close;
}

function formatTime(value?: string): string {
  const m = timeToMinutes(value);
  if (m === null) return "-";
  const d = new Date();
  d.setHours(Math.floor(m / 60), m % 60, 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatStoreHours(store: Store): string {
  if (timeToMinutes(store.jam_buka) === null || timeToMinutes(store.jam_tutup) === null) return "-";
  return formatTime(store.jam_buka) + " - " + formatTime(store.jam_tutup);
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
}