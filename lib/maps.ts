// Validasi & normalisasi tautan Google Maps yang diisi pemilik toko / admin.
const ALLOWED_HOSTS = [
  "maps.app.goo.gl",
  "goo.gl",
  "g.co",
  "google.com",
  "maps.google.com",
];

function hostAllowed(host: string): boolean {
  const h = host.toLowerCase();
  return ALLOWED_HOSTS.some((a) => h === a || h.endsWith("." + a)) || /^(www\.)?google\.[a-z.]{2,6}$/.test(h);
}

/**
 * Mengembalikan:
 *  - ""      jika input kosong (tautan dihapus)
 *  - string  URL https yang valid
 *  - null    jika input tidak valid
 */
export function normalizeMapsUrl(input: unknown): string | null {
  const raw = String(input ?? "").trim();
  if (!raw) return "";
  const withProto = /^https?:\/\//i.test(raw) ? raw : "https://" + raw;
  let u: URL;
  try {
    u = new URL(withProto);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (!hostAllowed(u.hostname)) return null;
  if (/(^|\.)google\./i.test(u.hostname) && !/^\/maps/i.test(u.pathname) && u.hostname.toLowerCase() !== "maps.google.com") {
    return null;
  }
  u.protocol = "https:";
  return u.toString();
}

export const MAPS_URL_ERROR =
  "Tautan Google Maps tidak valid. Salin tautan dari tombol Bagikan di Google Maps (contoh: https://maps.app.goo.gl/xxxx).";
