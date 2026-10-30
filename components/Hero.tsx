"use client";

import Link from "next/link";
import { useState } from "react";
import { txt, type Content } from "@/lib/home";

export default function Hero({ content, onSearch }: { content: Content; onSearch: (q: string) => void }) {
  const [q, setQ] = useState("");
  return (
    <section className="hero" id="beranda">
      <div className="container hero-inner">
        <span className="badge">{txt(content, "hero.badge", "Platform Kuliner Makassar")}</span>
        <h1>{txt(content, "hero.heading", "Temukan Es Pisang Ijo Favorit Kamu")}</h1>
        <p className="hero-sub">{txt(content, "hero.subheading", "Jelajahi pilihan es pisang ijo dan temukan menu kesukaanmu")}</p>

        <form className="search-bar" onSubmit={(e) => { e.preventDefault(); onSearch(q.trim()); }}>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={txt(content, "hero.search_placeholder", "Cari toko atau menu es pisang ijo")}
          />
          <button type="submit" className="btn btn-mustard">Cari</button>
        </form>

        <div className="hero-actions">
          <Link href="/#cari-toko" className="btn btn-mustard">{txt(content, "hero.cta_primary", "Cari Toko")}</Link>
          <Link href="/#menu" className="btn btn-outline-light">{txt(content, "hero.cta_secondary", "Lihat Menu")}</Link>
        </div>
      </div>
      <div className="hero-bowls" aria-hidden="true">
        <div className="bowl bowl-left"></div>
        <div className="bowl bowl-right"></div>
      </div>
    </section>
  );
}