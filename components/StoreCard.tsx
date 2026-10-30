"use client";

import { CardMedia } from "@/components/ImageSlideshow";
import { formatStoreHours, storeIsOpen, type Store } from "@/lib/home";

export default function StoreCard({
  store, now, variant, wished, onWish, onOpen,
}: {
  store: Store;
  now: Date;
  variant: "popular" | "result";
  wished: boolean;
  onWish: () => void;
  onOpen: () => void;
}) {
  const open = storeIsOpen(store, now);
  const popular = variant === "popular";
  return (
    <div className="store-card" onClick={onOpen}>
      <CardMedia value={store.image_url} alt={store.nama} placeholder={popular ? "Ceritanya gambar lokasi" : ""} />
      <div className="card-body">
        <button
          className={"wishlist-btn" + (wished ? " saved" : "")}
          type="button"
          title={wished ? "Hapus dari List Aku" : "Simpan ke List Aku"}
          onClick={(e) => { e.stopPropagation(); onWish(); }}
        >
          {wished ? "♥" : "♡"}
        </button>
        <h3>{store.nama}</h3>
        {!popular && <p className="meta">{store.alamat || ""}</p>}
        <p className="meta">Jam Buka: {formatStoreHours(store)}</p>
        <p className={"store-status " + (open ? "status-open" : "status-closed")}>
          {open ? (popular ? "Buka sekarang" : "Buka") : "Tutup"}
        </p>
        <span className="rating">★ {store.rating}</span>
        {!popular && (
          <>
            <br />
            <a href="#" className="link-arrow" style={{ marginTop: 10, display: "inline-block" }} onClick={(e) => e.preventDefault()}>
              Lihat Detail
            </a>
          </>
        )}
      </div>
    </div>
  );
}