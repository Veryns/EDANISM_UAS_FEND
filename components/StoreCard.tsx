"use client";

import ImageSlideshow from "@/components/ImageSlideshow";
import { HeartIcon } from "@/components/PjIcons";
import { imageList, formatStoreHours, storeIsOpen, type Store } from "@/lib/home";

// Kartu "Toko Populer" (kolom 1-3 pada desain)
export default function StoreCard({
  store, now, slot, wished, onWish, onOpen,
}: {
  store: Store;
  now: Date;
  slot: number;
  wished: boolean;
  onWish: () => void;
  onOpen: () => void;
}) {
  const open = storeIsOpen(store, now);
  const hasImg = imageList(store.image_url).length > 0;
  return (
    <article className={"pj-store pj-store-" + slot} onClick={onOpen}>
      {hasImg && (
        <div className="pj-store-media">
          <ImageSlideshow value={store.image_url} alt={store.nama} />
        </div>
      )}
      <button
        className={"pj-heart" + (wished ? " saved" : "")}
        type="button"
        title={wished ? "Hapus dari List Aku" : "Simpan ke List Aku"}
        onClick={(e) => { e.stopPropagation(); onWish(); }}
      >
        <HeartIcon size={24} filled />
      </button>
      <h3 className="pj-store-name">{store.nama}</h3>
      <p className="pj-store-hours">Jam Buka: {formatStoreHours(store)}</p>
      <p className={"pj-store-status " + (open ? "open" : "closed")}>{open ? "Buka sekarang" : "Tutup"}</p>
      <p className="pj-store-rate"><span>★</span> {store.rating}</p>
    </article>
  );
}

// Baris hasil "Cari Toko": foto + kartu info, selang-seling kiri/kanan
export function StoreResult({
  store, now, index, onOpen,
}: { store: Store; now: Date; index: number; onOpen: () => void }) {
  const open = storeIsOpen(store, now);
  const hasImg = imageList(store.image_url).length > 0;
  const flip = index % 2 === 1;
  return (
    <div className={"pj-row" + (flip ? " flip" : "")} onClick={onOpen}>
      <div className="pj-row-img">
        {hasImg ? <ImageSlideshow value={store.image_url} alt={store.nama} /> : <span>Gambar</span>}
      </div>
      <div className="pj-row-info">
        <h3>{store.nama}</h3>
        <p className="pj-row-hours">Jam Buka: {formatStoreHours(store)}</p>
        <p className={"pj-row-status " + (open ? "open" : "closed")}>{open ? "Buka sekarang" : "Tutup"}</p>
        <p className="pj-row-rate"><span>★</span> {store.rating}</p>
      </div>
    </div>
  );
}