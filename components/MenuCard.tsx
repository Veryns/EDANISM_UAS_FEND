"use client";

import { HeartIcon } from "@/components/PjIcons";
import { imageList, type MenuItem } from "@/lib/home";

// slot 0..3 -> kartu tengah (slot 1) disorot seperti pada desain
export default function MenuCard({
  menu, slot, wished, onWish, onOpen, onOpenStore,
}: {
  menu: MenuItem;
  slot: number;
  wished: boolean;
  onWish: () => void;
  onOpen: () => void;
  onOpenStore: (id: number) => void;
}) {
  const hasRating = (menu.ulasan_count ?? 0) > 0;
  const img = imageList(menu.image_url)[0];
  return (
    <article className={"pj-mc pj-mc-" + slot} onClick={onOpen}>
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="pj-mc-img" src={img} alt={menu.nama} />
      )}
      <button
        className={"pj-mc-heart" + (wished ? " saved" : "")}
        type="button"
        title={wished ? "Hapus dari List Aku" : "Simpan ke List Aku"}
        onClick={(e) => { e.stopPropagation(); onWish(); }}
      >
        <HeartIcon size={20} fill="currentColor" filled />
      </button>
      <h3 className="pj-mc-name">{menu.nama}</h3>
      <p className="pj-mc-rate">
        {hasRating ? (<><b>★</b> {menu.rating} <small>( {menu.ulasan_count} ulasan )</small></>) : <small>Belum ada rating</small>}
      </p>
      <p className="pj-mc-price">{menu.harga || ""}</p>
      {menu.store_nama && menu.store_id ? (
        <>
          <p className="pj-mc-store">Tersedia di:<br />{menu.store_nama}</p>
          <a
            href="#"
            className="pj-mc-link"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenStore(menu.store_id as number); }}
          >
            Lihat Toko Ini
          </a>
        </>
      ) : (
        <p className="pj-mc-store">Toko belum ditentukan</p>
      )}
    </article>
  );
}