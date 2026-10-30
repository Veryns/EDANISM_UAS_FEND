"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import StoreCard from "@/components/StoreCard";
import MenuCard from "@/components/MenuCard";
import TestimonialCard from "@/components/TestimonialCard";
import FaqAccordion from "@/components/FaqAccordion";
import Pagination from "@/components/Pagination";
import ImageSlideshow from "@/components/ImageSlideshow";
import AuthModal from "@/components/AuthModal";
import ReviewModal from "@/components/ReviewModal";
import StoreDetailModal from "@/components/StoreDetailModal";
import MenuDetailModal from "@/components/MenuDetailModal";
import { imageList, scrollToId, storeIsOpen, txt, type SiteData, type User } from "@/lib/home";

const MENU_PAGE_SIZE = 8;
const TESTI_PAGE_SIZE = 6;

export default function HomeClient() {
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

  const [menuPage, setMenuPage] = useState(1);
  const [testiPage, setTestiPage] = useState(1);

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

  const menuPages = Math.max(1, Math.ceil(menu.length / MENU_PAGE_SIZE));
  const mp = Math.min(menuPage, menuPages);
  const menuItems = menu.slice((mp - 1) * MENU_PAGE_SIZE, mp * MENU_PAGE_SIZE);

  const testiPages = Math.max(1, Math.ceil(testimonials.length / TESTI_PAGE_SIZE));
  const tp = Math.min(testiPage, testiPages);
  const testiItems = testimonials.slice((tp - 1) * TESTI_PAGE_SIZE, tp * TESTI_PAGE_SIZE);

  const about = content.about || {};
  const aboutImages = about.images || about.image_url;
  const hasAboutImages = imageList(aboutImages).length > 0;

  const storeDetail = stores.find((s) => s.id === storeDetailId);
  const menuDetail = menu.find((m) => m.id === menuDetailId);

  function openStore(id: number) { setMenuDetailId(null); setStoreDetailId(id); }
  function openMenu(id: number) { setStoreDetailId(null); setMenuDetailId(id); }

  return (
    <>
      <Navbar
        logoText={txt(content, "site.logo_text", "Pisang Ijo")}
        user={user}
        onLogin={() => setAuthTab("login")}
        onLogout={logout}
      />

      <Hero content={content} onSearch={heroSearch} />

      {/* TOKO POPULER */}
      <section className="section" id="toko-populer">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>{txt(content, "toko_populer.heading", "Toko Populer & Rating")}</h2>
              <p className="section-sub">{txt(content, "toko_populer.subheading", "Temukan toko yang sesuai dengan citarasa kesukaanmu")}</p>
            </div>
            <Link href="/#cari-toko" className="link-arrow">{txt(content, "toko_populer.link_text", "Lihat semua toko")}</Link>
          </div>
          <div className="grid grid-3">
            {loadError && <p style={{ color: "#B23A55" }}>Gagal memuat data dari server.</p>}
            {stores.slice(0, 3).map((t) => (
              <StoreCard
                key={t.id} store={t} now={now} variant="popular"
                wished={!!wish[`store:${t.id}`]}
                onWish={() => toggleWish("store", t.id)}
                onOpen={() => openStore(t.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* MENU */}
      <section className="section section-tinted" id="menu">
        <div className="container">
          <div className="section-head section-head-center">
            <h2>{txt(content, "menu_section.heading", "Menu Unggulan")}</h2>
            <p className="section-sub">{txt(content, "menu_section.subheading", "Pilih paduan rasa favorit untuk anda coba nanti")}</p>
          </div>
          <div className="grid grid-4">
            {menuItems.map((m) => (
              <MenuCard
                key={m.id} menu={m}
                wished={!!wish[`menu:${m.id}`]}
                onWish={() => toggleWish("menu", m.id)}
                onOpen={() => openMenu(m.id)}
                onOpenStore={openStore}
              />
            ))}
          </div>
          <Pagination
            light page={mp} total={menuPages}
            onChange={(p) => { setMenuPage(p); scrollToId("menu"); }}
          />
        </div>
      </section>

      {/* TENTANG */}
      <section className="section" id="tentang">
        <div className="container about-grid">
          <div className="about-media">
            <div className={"media-frame" + (hasAboutImages ? " has-slideshow" : "")}>
              {hasAboutImages ? (
                <ImageSlideshow value={aboutImages} alt={txt(content, "about.heading", "Tentang platform")} />
              ) : (
                txt(content, "about.media_text", "Ceritanya Gambar Bahan Bahan Pisang Ijo")
              )}
            </div>
          </div>
          <div className="about-copy">
            <span className="eyebrow-pink">{txt(content, "about.eyebrow", "Tentang Platform")}</span>
            <h2>{txt(content, "about.heading", "Merayakan segarnya rasa yang akrab")}</h2>
            <p>{txt(content, "about.description", "")}</p>
            <ul className="pill-list">
              <li className="pill pill-green">{txt(content, "about.pill_1", "Pisang Segar Pilihan")}</li>
              <li className="pill pill-mustard">{txt(content, "about.pill_2", "Santan Lembut")}</li>
              <li className="pill pill-pink">{txt(content, "about.pill_3", "Layanan Penuh Perhatian")}</li>
            </ul>
          </div>
        </div>
        <div className="container">
          <div className="history-box">
            <h3>{txt(content, "history.heading", "Sejarah Pisang Ijo")}</h3>
            <p>{txt(content, "history.text", "")}</p>
          </div>
        </div>
      </section>

      {/* TESTIMONI */}
      <section className="section section-dark" id="testimoni">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow-mustard">{txt(content, "testimonial_section.eyebrow", "Kota Mereka #MerekaBicara")}</span>
              <h2 className="light">{txt(content, "testimonial_section.heading", "Testimoni Pelanggan")}</h2>
            </div>
            <button className="btn btn-mustard" onClick={openReview}>{txt(content, "testimonial_section.cta", "Tulis Ulasan")}</button>
          </div>
          <div className="grid grid-3">
            {testiItems.map((t) => <TestimonialCard key={t.id} t={t} />)}
          </div>
          <Pagination
            page={tp} total={testiPages}
            onChange={(p) => { setTestiPage(p); scrollToId("testimoni"); }}
          />
        </div>
      </section>

      {/* CARI TOKO */}
      <section className="section" id="cari-toko">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow-mustard">{txt(content, "cari_toko.eyebrow", "Pencarian Lokasi")}</span>
              <h2>{txt(content, "cari_toko.heading", "Cari Toko Es Pisang Ijo")}</h2>
              <p className="section-sub">{txt(content, "cari_toko.subheading", "Masukkan nama toko atau menu dan area/kota secara manual")}</p>
            </div>
          </div>

          <form
            className="filter-bar"
            onSubmit={(e) => { e.preventDefault(); setApplied({ nama: fNama, status: fStatus, sort: fSort }); }}
          >
            <div className="field">
              <label htmlFor="filterNama">Nama Toko atau Menu</label>
              <input type="text" id="filterNama" placeholder="Nama Toko atau Menu" value={fNama} onChange={(e) => setFNama(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="filterStatus">Status Toko</label>
              <select id="filterStatus" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
                <option>Semua Status</option>
                <option>Buka</option>
                <option>Tutup</option>
              </select>
            </div>
            <div className="field field-sort">
              <label htmlFor="filterSort">&nbsp;</label>
              <select id="filterSort" value={fSort} onChange={(e) => setFSort(e.target.value)}>
                <option>Rating Tertinggi</option>
                <option>Nama A-Z</option>
              </select>
            </div>
            <button type="submit" className="btn btn-mustard">Terapkan Pencarian</button>
          </form>

          <p className="results-count"><span>{filtered.length}</span> Toko Ditemukan</p>

          <div className="grid grid-3">
            {filtered.map((t) => (
              <StoreCard
                key={t.id} store={t} now={now} variant="result"
                wished={!!wish[`store:${t.id}`]}
                onWish={() => toggleWish("store", t.id)}
                onOpen={() => openStore(t.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-tinted" id="faq">
        <div className="container faq-wrap">
          <div className="section-head section-head-center">
            <span className="eyebrow-mustard">{txt(content, "faq_section.eyebrow", "Butuh Bantuan?")}</span>
            <h2>{txt(content, "faq_section.heading", "Pertanyaan Yang Sering Ditanyakan")}</h2>
          </div>
          <FaqAccordion faqs={faqs} />
        </div>
      </section>

      {/* KONTAK */}
      <section className="section" id="kontak">
        <div className="container kontak-box">
          <div>
            <span className="eyebrow-mustard">{txt(content, "contact.eyebrow", "Kontak")}</span>
            <h2>{txt(content, "contact.heading", "Mari ngobrol tentang rasa favoritmu")}</h2>
            <p>
              Email support demo : <span>{txt(content, "contact.email", "halo@pisangijokita.com")}</span>
              <br />
              WhatsApp CS demo : <span>{txt(content, "contact.whatsapp", "+62 700 0000 0000")}</span>
            </p>
          </div>
          <div className="kontak-note">
            <p>{txt(content, "contact.note", "Butuh bantuan menggunakan halaman demo ini? Hubungi kanal contoh berikut pada jam layanan umum.")}</p>
            <p><strong>Jam layanan umum:</strong> <span>{txt(content, "contact.hours", "Senin - Sabtu, 09.00 - 18.00")}</span></p>
          </div>
        </div>
      </section>

      <Footer content={content} />

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