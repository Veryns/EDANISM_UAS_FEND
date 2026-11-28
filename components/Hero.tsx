"use client";

import Link from "next/link";
import { useState } from "react";
import { txt, type Content } from "@/lib/home";

export default function Hero({ content, onSearch }: { content: Content; onSearch: (q: string) => void }) {
  const [q, setQ] = useState("");
  return (
    <section className="pj-sec pj-hero" id="beranda">
      <div className="pj-stage" style={{ height: 1085 }}>
        <div className="pj-hero-wave" aria-hidden="true" />
        <span className="pj-badge">{txt(content, "hero.badge", "Kuliner Makassar")}</span>
        <h1 className="pj-h1">{txt(content, "hero.heading", "Temukan Es Pisang Ijo Favorit Kamu")}</h1>
        <p className="pj-hero-sub">{txt(content, "hero.subheading", "Jelajahi pilihan es pisang ijo dan temukan menu kesukaanmu")}</p>

        <form className="pj-hero-search" onSubmit={(e) => { e.preventDefault(); onSearch(q.trim()); }}>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Cari toko atau menu"
            placeholder={txt(content, "hero.search_placeholder", "Cari toko atau menu es pisang ijo")}
          />
          <button type="submit">Cari</button>
        </form>

        <Link href="/cari-toko" className="pj-hero-btn pj-hero-btn-1">{txt(content, "hero.cta_primary", "Cari toko")}</Link>
        <Link href="/menu" className="pj-hero-btn pj-hero-btn-2">{txt(content, "hero.cta_secondary", "Lihat menu")}</Link>

        <div className="pj-hero-circle" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pj-hero-bowl" src="/design/bowl.png" alt="Semangkuk es pisang ijo di atas nampan anyaman" />
      </div>
    </section>
  );
}