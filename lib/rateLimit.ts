import type { NextRequest } from "next/server";

type Entry = { count: number; reset: number };
const g = globalThis as unknown as { __rl?: Map<string, Entry> };
const store: Map<string, Entry> = (g.__rl ??= new Map());

function key(req: NextRequest, name: string) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  return `${name}:${ip}`;
}

export function rlBlocked(req: NextRequest, name: string, max: number) {
  const e = store.get(key(req, name));
  return !!e && e.reset > Date.now() && e.count >= max;
}

export function rlHit(req: NextRequest, name: string, windowMs: number) {
  const k = key(req, name);
  const now = Date.now();
  const e = store.get(k);
  if (!e || e.reset <= now) store.set(k, { count: 1, reset: now + windowMs });
  else e.count++;
}

export function checkRateLimit(req: NextRequest, name: string, max: number, windowMs: number) {
  if (rlBlocked(req, name, max)) return false;
  rlHit(req, name, windowMs);
  return true;
}