"use client";

import { CardMedia } from "@/components/ImageSlideshow";
import type { MenuItem } from "@/lib/home";

export default function MenuCard({
  menu, wished, onWish, onOpen, onOpenStore,
}: {
  menu: MenuItem;
  wished: boolean;
  onWish: () => void;
  onOpen: () => void;
  onOpenStore: (id: number) => void;
}) {
  return (
    <div className="menu-card" onClick={onOpen}>
      <CardMedia value={menu.image_url} alt={menu.nama} />
      <div className="card-body">
        <button
          className={"wishlist-btn" + (wished ? " saved" : "")}
          type="button"
          title={wished ? "Hapus dari List Aku" : "Simpan ke List Aku"}
          onClick={(e) => { e.stopPropagation(); onWish(); }}
        >
          {wished ? "♥" : "♡"}
        </button>
        <h3>{menu.nama}</h3>
        <p className="desc">{menu.deskripsi || ""}</p>
        <span className="price">{menu.harga || ""}</span>
        {menu.store_nama && menu.store_id ? (
          <>
            <p className="menu-store-info">Tersedia di: <strong>{menu.store_nama}</strong></p>
            <a
              href="#"
              className="link-arrow menu-toko-link"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenStore(menu.store_id as number); }}
            >
              Lihat Toko Ini
            </a>
          </>
        ) : (
          <p className="menu-store-info">Toko belum ditentukan</p>
        )}
      </div>
    </div>
  );
}