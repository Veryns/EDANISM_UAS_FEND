"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Live preview = bagian situs utama yang SEBENARNYA (halaman "/" di dalam iframe),
// jadi CSS, font, dan komponennya sama persis. Data draf dikirim lewat postMessage
// dan diterapkan oleh HomeClient (lihat blok "admin preview" di sana).

export type PreviewPatch =
  | { kind: "store" | "menu" | "testimonial" | "faq"; item: Record<string, unknown> };

// Section situs yang menampilkan tiap kunci konten / daftar
export const CONTENT_TARGET: Record<string, string> = {
  site: "header",
  hero: "beranda",
  toko_populer: "toko-populer",
  menu_section: "menu",
  about: "tentang",
  history: "tentang",
  testimonial_section: "testimoni",
  cari_toko: "cari-toko",
  faq_section: "faq",
  contact: "kontak",
  footer: "footer",
};
export const LIST_TARGET: Record<string, { target: string; kind: "store" | "menu" | "testimonial" | "faq" }> = {
  stores: { target: "toko-populer", kind: "store" },
  menu: { target: "menu", kind: "menu" },
  testimonials: { target: "testimoni", kind: "testimonial" },
  faqs: { target: "faq", kind: "faq" },
};

export default function SitePreview({
  target, content, patch,
}: {
  target: string;
  content?: { key: string; data: Record<string, unknown> };
  patch?: PreviewPatch;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(320);
  const payload = useMemo(() => ({ target, content, patch }), [target, content, patch]);
  const latest = useRef(payload);
  latest.current = payload;

  const send = useCallback(() => {
    ref.current?.contentWindow?.postMessage({ type: "pv-update", payload: latest.current }, window.location.origin);
  }, []);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin || e.source !== ref.current?.contentWindow) return;
      if (e.data?.type === "pv-ready") send();
      if (e.data?.type === "pv-size" && Number.isFinite(e.data.height)) {
        setHeight(Math.max(180, Math.min(900, Math.round(e.data.height))));
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [send]);

  useEffect(() => { send(); }, [payload, send]);

  return (
    <iframe
      ref={ref}
      src="/?pv=1"
      name="admin-preview"
      title="Live preview situs"
      scrolling="no"
      loading="eager"
      style={{ display: "block", width: "100%", height, border: 0, borderRadius: 8, background: "#FFFAEB", pointerEvents: "none" }}
    />
  );
}
