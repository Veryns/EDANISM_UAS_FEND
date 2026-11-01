"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ImageManager from "@/components/ImageManager";
import { imageList } from "@/lib/home";

type MenuRow = { id: number; nama: string; harga?: string | null; image_url?: string | null };
type Review = { id: number; nama: string; ulasan: string; waktu: string; stars: number; approved: number };
type Msg = { text: string; ok: boolean } | null;

function rupiah(value: string) {
  const digits = value.replace(/[^0-9]/g, "");
  return digits ? "Rp " + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";
}

export default function TokoDashboardClient() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [whoami, setWhoami] = useState("");

  const [store, setStore] = useState({ nama: "", alamat: "", jam_buka: "", jam_tutup: "" });
  const [storeImages, setStoreImages] = useState<string[]>([]);
  const [storeMsg, setStoreMsg] = useState<Msg>(null);

  const [menus, setMenus] = useState<MenuRow[]>([]);
  const [menuLoaded, setMenuLoaded] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [menuNama, setMenuNama] = useState("");
  const [menuHarga, setMenuHarga] = useState("");
  const [menuImages, setMenuImages] = useState<string[]>([]);
  const [menuMsg, setMenuMsg] = useState<Msg>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  const [confirmId, setConfirmId] = useState<number | null>(null);

  const loadStore = useCallback(async () => {
    const d = await fetch("/api/toko/me").then((r) => r.json());
    const s = d.store || {};
    setStore({
      nama: s.nama || "",
      alamat: s.alamat || "",
      jam_buka: s.jam_buka || "",
      jam_tutup: s.jam_tutup || "",
    });
    setStoreImages(imageList(s.image_url));
  }, []);

  const loadMenu = useCallback(async () => {
    const rows = await fetch("/api/toko/menu").then((r) => r.json());
    setMenus(Array.isArray(rows) ? rows : []);
    setMenuLoaded(true);
  }, []);

  const loadReviews = useCallback(async () => {
    const rows = await fetch("/api/toko/testimonials").then((r) => r.json());
    setReviews(Array.isArray(rows) ? rows : []);
    setReviewsLoaded(true);
  }, []);

  useEffect(() => {
    document.title = "Dashboard Toko — Pisang Ijo";
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.loggedIn || d.role !== "toko" || d.status !== "approved") {
          router.replace("/");
          return;
        }
        setWhoami("Halo, " + d.nama);
        setReady(true);
        loadStore();
        loadMenu();
        loadReviews();
      })
      .catch(() => router.replace("/"));
  }, [router, loadStore, loadMenu, loadReviews]);

  async function logout() {
    await fetch("/api/user/logout", { method: "POST" }).catch(() => {});
    router.push("/");
  }

  async function saveStore(e: React.FormEvent) {
    e.preventDefault();
    setStoreMsg(null);
    const res = await fetch("/api/toko/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...store, nama: store.nama.trim(), alamat: store.alamat.trim(), images: storeImages }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return setStoreMsg({ text: d.error || "Gagal menyimpan.", ok: false });
    setStoreMsg({ text: "Perubahan tersimpan.", ok: true });
    loadStore();
  }

  function exitEdit() {
    setEditingId(null);
    setMenuNama("");
    setMenuHarga("");
    setMenuImages([]);
  }

  function startEdit(m: MenuRow) {
    setEditingId(m.id);
    setMenuNama(m.nama || "");
    setMenuHarga(rupiah(String(m.harga || "")));
    setMenuImages(imageList(m.image_url));
    setMenuMsg(null);
    document.getElementById("menuForm")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function saveMenu(e: React.FormEvent) {
    e.preventDefault();
    setMenuMsg(null);
    const editing = editingId !== null;
    const res = await fetch(editing ? `/api/toko/menu/${editingId}` : "/api/toko/menu", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: menuNama.trim(), harga: menuHarga.trim(), images: menuImages }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      return setMenuMsg({
        text: d.error || (editing ? "Gagal menyimpan perubahan." : "Gagal menambah menu."),
        ok: false,
      });
    }
    exitEdit();
    setMenuMsg({ text: editing ? "Perubahan menu tersimpan." : "Menu ditambahkan.", ok: true });
    loadMenu();
  }

  async function deleteMenu() {
    const id = confirmId;
    setConfirmId(null);
    if (id === null) return;
    const res = await fetch(`/api/toko/menu/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (editingId === id) exitEdit();
      loadMenu();
    }
  }

  if (!ready) return null;

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="logo">Pisang Ijo</Link>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ color: "#D9E6DE", fontSize: "0.9rem" }}>{whoami}</span>
            <Link href="/" className="btn btn-outline-light">Lihat Website</Link>
            <button className="btn btn-outline-light" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      <section className="dash-wrap">
        <h2>Dashboard Toko</h2>
        <p className="section-sub" style={{ marginBottom: 24 }}>Kelola informasi toko kamu di sini.</p>

        <div className="dash-card">
          <h3 style={{ marginBottom: 18 }}>Informasi Toko</h3>
          <label className="dash-label">Gambar Toko</label>
          <ImageManager
            images={storeImages}
            onChange={setStoreImages}
            max={10}
            onError={(t) => setStoreMsg({ text: t, ok: false })}
          />
          <p className="img-manager-hint">
            Bisa pilih beberapa gambar sekaligus. Gambar pertama jadi sampul. Maks 3MB per gambar (JPG/PNG/WEBP).
          </p>

          <form onSubmit={saveStore}>
            <div className="dash-field">
              <label htmlFor="storeNama">Nama Toko</label>
              <input id="storeNama" type="text" required value={store.nama} onChange={(e) => setStore({ ...store, nama: e.target.value })} />
            </div>
            <div className="dash-field">
              <label htmlFor="storeAlamat">Alamat</label>
              <textarea id="storeAlamat" rows={2} value={store.alamat} onChange={(e) => setStore({ ...store, alamat: e.target.value })} />
            </div>
            <div className="dash-row">
              <div className="dash-field">
                <label htmlFor="storeJamBuka">Jam Buka</label>
                <input id="storeJamBuka" type="time" value={store.jam_buka} onChange={(e) => setStore({ ...store, jam_buka: e.target.value })} />
              </div>
              <div className="dash-field">
                <label htmlFor="storeJamTutup">Jam Tutup</label>
                <input id="storeJamTutup" type="time" value={store.jam_tutup} onChange={(e) => setStore({ ...store, jam_tutup: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-mustard" style={{ width: "100%" }}>Simpan Perubahan</button>
            {storeMsg && <div className={"dash-msg show " + (storeMsg.ok ? "ok" : "err")}>{storeMsg.text}</div>}
          </form>
        </div>

        <div className="dash-card">
          <h3 style={{ marginBottom: 18 }}>Menu Toko</h3>
          <div className="menu-list">
            {!menuLoaded && <p className="section-sub">Memuat menu...</p>}
            {menuLoaded && menus.length === 0 && (
              <p className="section-sub">Belum ada menu. Tambahkan menu pertama kamu di bawah.</p>
            )}
            {menus.map((m) => {
              const pics = imageList(m.image_url);
              return (
                <div className="menu-row" key={m.id}>
                  {pics[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="menu-row-img" src={pics[0]} alt={m.nama} />
                  ) : (
                    <div className="menu-row-img placeholder">Tanpa gambar</div>
                  )}
                  <div className="menu-row-info">
                    <strong>{m.nama}</strong>
                    <span>
                      {m.harga || "Harga belum diisi"}
                      {pics.length > 1 ? ` · ${pics.length} foto` : ""}
                    </span>
                  </div>
                  <div className="menu-row-actions">
                    <button type="button" className="menu-row-edit" onClick={() => startEdit(m)}>Edit</button>
                    <button type="button" className="menu-row-del" onClick={() => setConfirmId(m.id)}>Hapus</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="menu-form-box">
            <h4 style={{ margin: "0 0 14px" }}>{editingId !== null ? "Edit Menu" : "Tambah Menu Baru"}</h4>
            <label className="dash-label">Gambar Menu</label>
            <ImageManager
              images={menuImages}
              onChange={setMenuImages}
              max={10}
              onError={(t) => setMenuMsg({ text: t, ok: false })}
            />
            <p className="img-manager-hint">
              Bisa pilih beberapa gambar sekaligus (maks 10). Gambar pertama jadi sampul. Maks 3MB per gambar.
            </p>

            <form id="menuForm" onSubmit={saveMenu}>
              <div className="dash-field">
                <label htmlFor="menuNama">Nama Menu</label>
                <input id="menuNama" type="text" maxLength={100} required value={menuNama} onChange={(e) => setMenuNama(e.target.value)} />
              </div>
              <div className="dash-field">
                <label htmlFor="menuHarga">Harga</label>
                <input
                  id="menuHarga"
                  type="text"
                  inputMode="numeric"
                  placeholder="Rp 15.000"
                  value={menuHarga}
                  onFocus={() => { if (!menuHarga) setMenuHarga("Rp "); }}
                  onChange={(e) => setMenuHarga(rupiah(e.target.value))}
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" className="btn btn-mustard" style={{ flex: 1 }}>
                  {editingId !== null ? "Simpan Perubahan" : "Tambah Menu"}
                </button>
                {editingId !== null && (
                  <button type="button" className="btn-cancel-edit" onClick={exitEdit}>Batal</button>
                )}
              </div>
              {menuMsg && <div className={"dash-msg show " + (menuMsg.ok ? "ok" : "err")}>{menuMsg.text}</div>}
            </form>
          </div>
        </div>

        <div className="dash-card">
          <h3 style={{ marginBottom: 18 }}>Ulasan Masuk</h3>
          <div>
            {!reviewsLoaded && <p className="section-sub">Memuat ulasan...</p>}
            {reviewsLoaded && reviews.length === 0 && <p className="section-sub">Belum ada ulasan masuk.</p>}
            {reviews.map((r) => {
              const n = Number(r.stars) || 5;
              return (
                <div className="review-item" key={r.id}>
                  <div className="stars">{"★".repeat(n) + "☆".repeat(5 - n)}</div>
                  <strong>{r.nama}</strong>
                  {Number(r.approved) !== 1 && (
                    <span style={{ color: "#C9852A" }}> (menunggu approval admin)</span>
                  )}
                  <p style={{ margin: "6px 0 0" }}>{r.ulasan}</p>
                  <p className="section-sub" style={{ margin: "4px 0 0", fontSize: "0.8rem" }}>{r.waktu}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div
        className={"confirm-overlay" + (confirmId !== null ? " open" : "")}
        onClick={(e) => { if (e.target === e.currentTarget) setConfirmId(null); }}
      >
        <div className="confirm-box">
          <h3>Konfirmasi</h3>
          <p>Hapus menu ini? Ulasan untuk menu ini juga ikut terhapus.</p>
          <div className="confirm-actions">
            <button type="button" className="confirm-cancel" onClick={() => setConfirmId(null)}>Batal</button>
            <button type="button" className="confirm-ok" onClick={deleteMenu}>Ya, Hapus</button>
          </div>
        </div>
      </div>
    </>
  );
}