// Kunci hari (YYYY-MM-DD) dalam WIB (UTC+7), dipakai untuk semua statistik harian.
const WIB = 7 * 60 * 60 * 1000;

export function dayKey(d: Date | number = Date.now()): string {
  const t = typeof d === "number" ? d : d.getTime();
  return new Date(t + WIB).toISOString().slice(0, 10);
}

export function addDays(key: string, n: number): string {
  const t = Date.parse(key + "T00:00:00Z") + n * 24 * 60 * 60 * 1000;
  return new Date(t).toISOString().slice(0, 10);
}
