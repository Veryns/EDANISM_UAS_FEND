"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import PjScale from "@/components/Pjscale";
import StoreCard, { StoreResult } from "@/components/StoreCard";
import MenuCard from "@/components/MenuCard";
import TestimonialCard from "@/components/TestimonialCard";
import FaqAccordion from "@/components/FaqAccordion";
import { ChevronIcon } from "@/components/PjIcons";
import AuthModal from "@/components/AuthModal";
import ReviewModal from "@/components/ReviewModal";
import StoreDetailModal from "@/components/StoreDetailModal";
import MenuDetailModal from "@/components/MenuDetailModal";
import { scrollToId, storeIsOpen, txt, type SiteData, type User } from "@/lib/home";

const MENU_UNGGULAN_LIMIT = 6;
const MENU_PAGE_SIZE = 4;
const TESTI_PAGE_SIZE = 6;

// Huruf vector "review" dari Figma (file ada di public/design/review-*.svg).
// Posisi & lebar dalam koordinat stage 1440px.
const REVIEW_LETTERS = [
  { n: "r", left: 0, top: 256, w: 350 },
  { n: "e1", left: 388, top: 283, w: 575 },
  { n: "v", left: 932, top: 215, w: 509 },
  { n: "i", left: 44, top: 949, w: 438 },
  { n: "e2", left: 376, top: 910, w: 592 },
  { n: "w", left: 806, top: 985, w: 634 },
];

export default function HomeClient({ only }: { only?: string }) {
  const show = (id: string) => !only || only === id;

  const [data, setData] = useState<SiteData>({ content: {}, stores: [], menu: [], testimonials: [], faqs: [] });
  const [loadError, setLoadError] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [wish, setWish] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(() => new Date());

  const [authTab, setAuthTab] = useState<"login" | "register" | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [storeDetailId, setStoreDetailId] = useState<number | null>(null);
  const [menuDetailId, setMenuDetailId] = useState<number | null>(null);

  const [fNama, setFNama] = useState("");
  const [fStatus, setFStatus] = useState("Semua Status");
  const [fSort, setFSort] = useState("Rating Tertinggi");
  const [applied, setApplied] = useState({ nama: "", status: "Semua Status", sort: "Rating Tertinggi" });

  const [testiPage, setTestiPage] = useState(1);
  const [menuPage, setMenuPage] = useState(1);

  const { content, stores, menu, testimonials, faqs } = data;

  useEffect(() => {
    fetch("/api/site-content")
      .then((r) => r.json())
      .then((d: SiteData) => {
        setData(d);
        const title = d.content?.site?.site_title;
        if (typeof title === "string" && title) document.title = title;
      })
      .catch(() => setLoadError(true));
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((d) => { if (d.loggedIn) setUser({ nama: d.nama, email: d.email, role: d.role }); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);

  async function loadWishlist() {
    const rows: { item_type: string; item_id: number }[] = await fetch("/api/wishlist/ids")
      .then((r) => r.json())
      .catch(() => []);
    const next: Record<string, boolean> = {};
    if (Array.isArray(rows)) rows.forEach((r) => (next[`${r.item_type}:${r.item_id}`] = true));
    setWish(next);
  }

  useEffect(() => {
    if (user) loadWishlist();
    else setWish({});
  }, [user]);

  async function toggleWish(type: "menu" | "store", id: number) {
    if (!user) return setAuthTab("login");
    if (wish[`${type}:${id}`]) {
      await fetch(`/api/wishlist/${type}/${id}`, { method: "DELETE" });
    } else {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_type: type, item_id: id }),
      });
    }
    loadWishlist();
  }

  async function logout() {
    await fetch("/api/user/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }

  function openReview() {
    if (!user) return setAuthTab("login");
    setReviewOpen(true);
  }

  function heroSearch(q: string) {
    setFNama(q);
    setApplied({ nama: q, status: fStatus, sort: fSort });
    scrollToId("cari-toko");
  }

  const filtered = useMemo(() => {
    const nama = applied.nama.trim().toLowerCase();
    const list = stores.filter((t) => {
      const matchNama = !nama || t.nama.toLowerCase().includes(nama);
      const open = storeIsOpen(t, now);
      const matchStatus =
        applied.status === "Semua Status" ||
        (applied.status === "Buka" && open) ||
        (applied.status === "Tutup" && !open);
      return matchNama && matchStatus;
    });
    if (applied.sort === "Rating Tertinggi") list.sort((a, b) => b.rating - a.rating);
    else list.sort((a, b) => a.nama.localeCompare(b.nama));
    return list;
  }, [stores, applied, now]);

  // Menu Unggulan: server sudah mengurutkan menu dari rating tertinggi.
  // Menu yang belum punya ulasan disetujui tidak ditampilkan, lalu diambil 6 teratas.
  const menuItems = menu
    .filter((m) => (m.ulasan_count ?? 0) > 0)
    .slice(0, MENU_UNGGULAN_LIMIT);

  const testiPages = Math.max(1, Math.ceil(testimonials.length / TESTI_PAGE_SIZE));
  const tp = Math.min(testiPage, testiPages);
  const testiItems = testimonials.slice((tp - 1) * TESTI_PAGE_SIZE, tp * TESTI_PAGE_SIZE);

  const menuPages = Math.max(1, Math.ceil(menuItems.length / MENU_PAGE_SIZE));
  const mp = Math.min(menuPage, menuPages);
  const menuShown = menuItems.slice((mp - 1) * MENU_PAGE_SIZE, mp * MENU_PAGE_SIZE);

  const about = content.about || {};

  const storeDetail = stores.find((s) => s.id === storeDetailId);
  const menuDetail = menu.find((m) => m.id === menuDetailId);

  function openStore(id: number) { setMenuDetailId(null); setStoreDetailId(id); }
  function openMenu(id: number) { setStoreDetailId(null); setMenuDetailId(id); }

  const cls = (base: string) => base + (only ? " pj-only" : "");

  return (
    <>
      <PjScale />
      <Navbar
        logoText={txt(content, "site.logo_text", "Pisang Ijo")}
        user={user}
        onLogin={() => setAuthTab("login")}
        onLogout={logout}
      />

      {!only && <Hero content={content} onSearch={heroSearch} />}

      {/* TOKO POPULER */}
      {show("toko-populer") && (
      <section className={cls("pj-sec pj-toko")} id="toko-populer">
        <div className="pj-stage" style={{ height: 2300  }}>
          <h2 className="pj-toko-h">{txt(content, "toko_populer.heading", "Toko Populer & Rating")}</h2>
          <p className="pj-toko-sub">{txt(content, "toko_populer.subheading", "Temukan toko yang sesuai dengan citarasa kesukaanmu.")}</p>
          <Link href="/cari-toko" className="pj-toko-link">{txt(content, "toko_populer.link_text", "Lihat semua toko")}</Link>
          {loadError && <p className="pj-error">Gagal memuat data dari server.</p>}
          {stores.slice(0, 3).map((t, i) => (
            <StoreCard
              key={t.id} store={t} now={now} slot={i}
              wished={!!wish[`store:${t.id}`]}
              onWish={() => toggleWish("store", t.id)}
              onOpen={() => openStore(t.id)}
            />
          ))}
        </div>
      </section>
      )}

      {/* MENU UNGGULAN */}
      {show("menu") && (
      <section className="pj-sec pj-menu" id="menu">
        <div className="pj-stage" style={{ height: 1064 }}>
          <h2 className="pj-menu-h">{txt(content, "menu_section.heading", "Menu Unggulan")}</h2>
          <p className="pj-menu-sub">{txt(content, "menu_section.subheading", "Pilih paduan rasa favorit untuk anda coba nanti")}</p>
          {menuPages > 1 && (
            <>
              <button type="button" className="pj-arrow-sm pj-menu-prev" aria-label="Menu sebelumnya" disabled={mp === 1} onClick={() => setMenuPage(mp - 1)}>
                <ChevronIcon dir="left" />
              </button>
              <button type="button" className="pj-arrow-sm pj-menu-next" aria-label="Menu berikutnya" disabled={mp === menuPages} onClick={() => setMenuPage(mp + 1)}>
                <ChevronIcon dir="right" />
              </button>
            </>
          )}
          {menuShown.map((m, i) => (
            <MenuCard
              key={m.id} menu={m} slot={i}
              wished={!!wish[`menu:${m.id}`]}
              onWish={() => toggleWish("menu", m.id)}
              onOpen={() => openMenu(m.id)}
              onOpenStore={openStore}
            />
          ))}
          {menuItems.length === 0 && (
            <p className="pj-empty" style={{ top: 520 }}>Belum ada menu yang dinilai. Jadilah yang pertama memberi ulasan!</p>
          )}
        </div>
      </section>
      )}

      {/* TENTANG */}
      {show("tentang") && (
      <section className="pj-sec pj-about" id="tentang">
        <div className="pj-stage" style={{ height: 1010 }}>
          <div className="pj-pill pj-pill-1" aria-hidden="true" />
          <div className="pj-pill pj-pill-2" aria-hidden="true" />
          <div className="pj-blob-dark" aria-hidden="true" />
          <h2 className="pj-about-h">About Us</h2>
          <p className="pj-about-p">
            {txt(content, "about.description", "Pisang Ijo adalah platform yang menghubungkan para pecinta kuliner tradisional Makassar dengan mitra UMKM dan kedai lokal terbaik di seluruh Jabodetabek. Kami berkomitmen untuk melestarikan cita rasa nusantara melalui kemudahan pemesanan online, jaminan kebersihan, serta standar kualitas bahan baku kelapa dan pisang pilihan yang selalu segar setiap hari.")}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="pj-coconut" src="/design/coconut.png" alt="Buah kelapa dibelah" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="pj-banana" src="/design/banana.png" alt="Sesisir pisang" />
          <div className="pj-blob-cream" aria-hidden="true" />
          <h2 className="pj-hist-h">Sejarah</h2>
          <p className="pj-hist-p">
            {txt(content, "history.text", "Sejak pertama kali berdiri, kami konsisten menjaga kualitas rasa melalui pemilihan pisang pilihan yang matang pas, adonan lembut berbalut daun suji alami, dipadu dengan gurihnya vla santan dan es yang menyegarkan. Kini, kami terus berkembang dan memperluas jangkauan melalui kemitraan di berbagai titik strategis agar dapat melayani pelanggan setia dengan lebih dekat dan cepat.")}
          </p>
        </div>
      </section>
      )}

      {/* TESTIMONI / REVIEW */}
      {show("testimoni") && (
      <section className="pj-sec pj-review" id="testimoni">
        <div className="pj-stage" style={{ height: 1781 }}>
          <div className="pj-drip pj-drip-1" aria-hidden="true" />
          <div className="pj-drip pj-drip-2" aria-hidden="true" />
          {REVIEW_LETTERS.map((l) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={l.n}
              className="pj-rl"
              style={{ left: l.left, top: l.top, width: l.w }}
              src={`/design/review-${l.n}.svg`}
              alt=""
              aria-hidden="true"
            />
          ))}
          <button type="button" className="pj-write" onClick={openReview}>{txt(content, "testimonial_section.cta", "Tulis Ulasan")}</button>
          {testiPages > 1 && (
            <>
              <button type="button" className="pj-arrow-lg pj-rv-prev" aria-label="Ulasan sebelumnya" disabled={tp === 1} onClick={() => setTestiPage(tp - 1)}>
                <ChevronIcon dir="left" size={30} width={2.4} />
              </button>
              <button type="button" className="pj-arrow-lg pj-rv-next" aria-label="Ulasan berikutnya" disabled={tp === testiPages} onClick={() => setTestiPage(tp + 1)}>
                <ChevronIcon dir="right" size={30} width={2.4} />
              </button>
            </>
          )}
          <div className="pj-rv-grid">
            {testiItems.map((t, i) => <TestimonialCard key={t.id} t={t} slot={i} />)}
          </div>
        </div>
      </section>
      )}

      {/* CARI TOKO */}
      {show("cari-toko") && (
      <section className="pj-sec pj-cari" id="cari-toko">
        <div className="pj-stage" style={{ height: 483 + Math.max(filtered.length, 1) * 321 + 60 }}>
          <h2 className="pj-cari-h">{txt(content, "cari_toko.heading", "Cari Toko Es Pisang Ijo")}</h2>
          <p className="pj-cari-sub">{txt(content, "cari_toko.subheading", "Masukkan nama toko atau menu dan area/kota secara manual")}</p>

          <form
            className="pj-filter"
            onSubmit={(e) => { e.preventDefault(); setApplied({ nama: fNama, status: fStatus, sort: fSort }); }}
          >
            <label htmlFor="filterNama" className="pj-fl-1">Nama Toko / Menu</label>
            <input type="text" id="filterNama" className="pj-fi-1" placeholder="Nama Toko / Menu" value={fNama} onChange={(e) => setFNama(e.target.value)} />
            <label htmlFor="filterStatus" className="pj-fl-2">Status Toko</label>
            <select id="filterStatus" className="pj-fi-2" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option>Semua Status</option>
              <option>Buka</option>
              <option>Tutup</option>
            </select>
            <select id="filterSort" aria-label="Urutkan" className="pj-fi-3" value={fSort} onChange={(e) => setFSort(e.target.value)}>
              <option>Rating Tertinggi</option>
              <option>Nama A-Z</option>
            </select>
            <button type="submit" className="pj-fbtn">Cari</button>
          </form>

          <p className="pj-count"><span>{filtered.length}</span> Toko Ditemukan</p>

          {filtered.map((t, i) => (
            <StoreResult key={t.id} store={t} now={now} index={i} onOpen={() => openStore(t.id)} />
          ))}
        </div>
      </section>
      )}

      {/* FAQ */}
      {show("faq") && (
      <section className="pj-sec pj-faq" id="faq">
        <div className="pj-stage">
          <svg className="pj-cloud" width="1440" height="560" viewBox="0 0 1440 560" aria-hidden="true">
            <g fill="#FFF9EC">
              <ellipse cx="660" cy="330" rx="275" ry="150" />
              <ellipse cx="830" cy="250" rx="215" ry="140" />
              <ellipse cx="760" cy="395" rx="260" ry="90" />
              <ellipse cx="900" cy="320" rx="160" ry="130" />
              <circle cx="175" cy="330" r="48" /><circle cx="215" cy="410" r="62" /><circle cx="205" cy="335" r="52" />
              <circle cx="1210" cy="232" r="52" /><circle cx="1292" cy="226" r="44" /><circle cx="1262" cy="262" r="42" />
            </g>
          </svg>
          <h2 className="pj-faq-h">You Asked<br />We Answered</h2>
          <div className="pj-qo" style={{ left: 0, top: 700, opacity: 0.85 }} aria-hidden="true">QUESTION</div>
          <div className="pj-qo" style={{ left: -130, top: 1095, opacity: 0.7 }} aria-hidden="true">QUESTION</div>
          <div className="pj-qo" style={{ left: -260, top: 1490, opacity: 0.55 }} aria-hidden="true">QUESTION</div>
          <div className="pj-qo" style={{ left: -390, top: 1885, opacity: 0.25 }} aria-hidden="true">QUESTION</div>
          <FaqAccordion faqs={faqs} />
          <svg className="pj-wave" width="1440" height="420" viewBox="0 2000 1440 420" preserveAspectRatio="none" aria-hidden="true">
            
            <path d="M-30 2137 C-25 2137 -17 2133 0 2137 C17 2140 41 2159 70 2157 C100 2155 145 2139 177 2127 C210 2116 235 2092 267 2089 C298 2087 331 2105 368 2113 C404 2121 443 2137 487 2139 C530 2142 590 2122 630 2127 C669 2132 695 2160 725 2170 C754 2180 782 2187 808 2187 C834 2187 856 2178 879 2170 C903 2162 927 2138 948 2137 C970 2136 976 2150 1010 2163 C1044 2176 1111 2209 1153 2213 C1195 2217 1228 2197 1260 2184 C1292 2171 1314 2147 1344 2134 C1373 2122 1419 2115 1440 2111 C1461 2107 1465 2111 1470 2111 L1470 2262 L-30 2262 Z" fill="#E0DECF" />
            
            <path d="M-30 2137 C-25 2137 -17 2133 0 2137 C17 2140 41 2159 70 2157 C100 2155 145 2139 177 2127 C210 2116 235 2092 267 2089 C298 2087 331 2105 368 2113 C404 2121 443 2137 487 2139 C530 2142 590 2122 630 2127 C669 2132 695 2160 725 2170 C754 2180 782 2187 808 2187 C834 2187 856 2178 879 2170 C903 2162 927 2138 948 2137 C970 2136 976 2150 1010 2163 C1044 2176 1111 2209 1153 2213 C1195 2217 1228 2197 1260 2184 C1292 2171 1314 2147 1344 2134 C1373 2122 1419 2115 1440 2111 C1461 2107 1465 2111 1470 2111 L1470 2000 L-30 2000 Z" fill="#70826A" />

            <path d="M-30 2137 C-25 2137 -17 2133 0 2137 C17 2140 41 2159 70 2157 C100 2155 145 2139 177 2127 C210 2116 235 2092 267 2089 C298 2087 331 2105 368 2113 C404 2121 443 2137 487 2139 C530 2142 590 2122 630 2127 C669 2132 695 2160 725 2170 C754 2180 782 2187 808 2187 C834 2187 856 2178 879 2170 C903 2162 927 2138 948 2137 C970 2136 976 2150 1010 2163 C1044 2176 1111 2209 1153 2213 C1195 2217 1228 2197 1260 2184 C1292 2171 1314 2147 1344 2134 C1373 2122 1419 2115 1440 2111 C1461 2107 1465 2111 1470 2111" fill="none" stroke="#17381B" strokeWidth="72" strokeLinecap="round" />
          </svg>
        </div>
      </section>
      )}

      <div className="pj-cf">
      {/* KONTAK */}
      {show("kontak") && (
      <section className={cls("pj-sec pj-contact")} id="kontak">
        <div className="pj-stage" style={{ height: only ? 1310 : 790 }}>
          {/* bentuk kartu, footer, dan kotak hijau: vector asli Figma (public/design/contact-*.svg) */}
          {/* eslint-disable @next/next/no-img-element */}
          <img className="pj-cs pj-c-card" src="/design/contact-card.svg" alt="" aria-hidden="true" />
          <img className="pj-cs pj-c-foot" src="/design/contact-footer.svg" alt="" aria-hidden="true" />
          <img className="pj-cs pj-c-sql" src="/design/contact-sq-left.svg" alt="" aria-hidden="true" />
          <img className="pj-cs pj-c-sqr" src="/design/contact-sq-right.svg" alt="" aria-hidden="true" />
          {/* eslint-enable @next/next/no-img-element */}
          <h2 className="pj-contact-h">Contact</h2>
          <p className="pj-contact-sub">{txt(content, "contact.heading", "Mari ngobrol tentang rasa favoritmu")}</p>
          <p className="pj-contact-k">Email<br />WhatsApp CS</p>
          <p className="pj-contact-v">
            : {txt(content, "contact.email", "halo@pisangijo.com")}
            <br />
            : {txt(content, "contact.whatsapp", "+62 700 0000 0000")}
          </p>
        </div>
      </section>
      )}

      {!only && <Footer content={content} />}
      </div>

      {authTab && (
        <AuthModal
          key={authTab}
          initialTab={authTab}
          onClose={() => setAuthTab(null)}
          onAuthed={setUser}
        />
      )}
      {reviewOpen && <ReviewModal stores={stores} menu={menu} onClose={() => setReviewOpen(false)} />}

      <StoreDetailModal
        store={storeDetail}
        menus={storeDetail ? menu.filter((m) => m.store_id === storeDetail.id) : []}
        now={now}
        onClose={() => setStoreDetailId(null)}
        onOpenMenu={openMenu}
      />
      <MenuDetailModal menu={menuDetail} onClose={() => setMenuDetailId(null)} onOpenStore={openStore} />
    </>
  );
}