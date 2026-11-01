"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import { CardMedia } from "@/components/ImageSlideshow";
import { txt, type Content, type MenuItem, type Store, type User } from "@/lib/home";

type WishData = { menu: MenuItem[]; stores: Store[] };

export default function WishlistClient() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [content, setContent] = useState<Content>({});
  const [data, setData] = useState<WishData>({ menu: [], stores: [] });
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    document.title = "List yang Pengen Kamu Coba | Es Pisang Ijo";
    fetch("/api/site-content")
      .then((r) => r.json())
      .then((d) => setContent(d.content || {}))
      .catch(() => {});
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.loggedIn) setUser({ nama: d.nama, email: d.email, role: d.role });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/wishlist");
    if (!res.ok) return;
    const d = await res.json();
    setData({ menu: d.menu || [], stores: d.stores || [] });
  }, []);

  useEffect(() => {
    if (user) load();
    else setData({ menu: [], stores: [] });
  }, [user, load]);

  async function remove(type: "menu" | "store", id: number) {
    if (!user) return setAuthOpen(true);
    await fetch(`/api/wishlist/${type}/${id}`, { method: "DELETE" });
    load();
  }

  async function logout() {
    await fetch("/api/user/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }

  const { menu, stores } = data;
  const empty = menu.length === 0 && stores.length === 0;

  return (
    <>
      <Navbar
        logoText={txt(content, "site.logo_text", "Pisang Ijo")}
        user={user}
        onLogin={() => setAuthOpen(true)}
        onLogout={logout}
      />

      <section className="section section-tinted" style={{ paddingTop: 56 }}>
        <div className="container">
          <div className="section-head section-head-center">
            <span className="eyebrow-mustard">List Aku</span>
            <h2>List yang Pengen Kamu Coba</h2>
            <p className="section-sub">Menu dan toko yang sudah kamu simpan untuk dicoba nanti</p>
          </div>

          {ready && !user && (
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
                Kamu perlu login dulu untuk melihat list ini.
              </p>
              <button className="btn btn-mustard" onClick={() => setAuthOpen(true)}>
                Login / Sign In
              </button>
            </div>
          )}

          {ready && user && (
            <div>
              <h3 style={{ marginTop: 32 }}>Menu</h3>
              <div className="grid grid-4">
                {menu.map((m) => (
                  <div key={m.id} className="menu-card">
                    <CardMedia value={m.image_url} alt={m.nama} />
                    <div className="card-body">
                      <button
                        className="wishlist-btn saved"
                        type="button"
                        title="Hapus dari List"
                        onClick={() => remove("menu", m.id)}
                      >
                        ♥
                      </button>
                      <h3>{m.nama}</h3>
                      <p className="desc">{m.store_nama ? "Dari: " + m.store_nama : m.deskripsi || ""}</p>
                      <span className="price">{m.harga || ""}</span>
                    </div>
                  </div>
                ))}
              </div>

              <h3 style={{ marginTop: 48 }}>Toko</h3>
              <div className="grid grid-3">
                {stores.map((t) => (
                  <div key={t.id} className="store-card">
                    <CardMedia value={t.image_url} alt={t.nama} />
                    <div className="card-body">
                      <button
                        className="wishlist-btn saved"
                        type="button"
                        title="Hapus dari List"
                        onClick={() => remove("store", t.id)}
                      >
                        ♥
                      </button>
                      <h3>{t.nama}</h3>
                      <p className="meta">{t.alamat || ""}</p>
                    </div>
                  </div>
                ))}
              </div>

              {empty && (
                <p style={{ textAlign: "center", color: "var(--text-muted)", marginTop: 24 }}>
                  Belum ada yang kamu simpan. Klik ikon hati di menu atau toko favoritmu!
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer content={content} />

      {authOpen && (
        <AuthModal
          initialTab="login"
          onClose={() => setAuthOpen(false)}
          onAuthed={setUser}
        />
      )}
    </>
  );
}