"use client";

import ImageSlideshow from "@/components/ImageSlideshow";
import { formatStoreHours, imageList, storeIsOpen, type MenuItem, type Store } from "@/lib/home";

export default function StoreDetailModal({
  store, menus, now, onClose, onOpenMenu,
}: {
  store?: Store;
  menus: MenuItem[];
  now: Date;
  onClose: () => void;
  onOpenMenu: (id: number) => void;
}) {
  const open = store ? storeIsOpen(store, now) : false;
  return (
    <div className={"modal-overlay" + (store ? " active" : "")} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box modal-box-lg">
        <button className="modal-close" onClick={onClose}>&times;</button>
        {store && (
          <>
            <div className="detail-hero">
              {imageList(store.image_url).length ? (
                <ImageSlideshow value={store.image_url} alt={store.nama} />
              ) : (
                <div className="detail-hero-placeholder">Ceritanya Gambar Toko</div>
              )}
            </div>
            <div className="detail-content">
              <div className="detail-top">
                <div>
                  <span className={"detail-status " + (open ? "status-open" : "status-closed")}>
                    {open ? "Buka sekarang" : "Tutup"}
                  </span>
                  <h3>{store.nama}</h3>
                  <p className="meta">{store.alamat || "-"}</p>
                </div>
                <div className="detail-rating">
                  <span className="rating">★ {store.rating || 0}</span>
                </div>
              </div>

              <div className="detail-info-row">
                <div className="info-chip"><strong>Jam Buka</strong><span>{formatStoreHours(store)}</span></div>
              </div>

              <h4>Menu Tersedia</h4>
              <div className="detail-menu-list">
                {menus.length === 0 ? (
                  <p className="meta">Belum ada menu untuk toko ini.</p>
                ) : (
                  menus.map((m) => (
                    <div key={m.id} className="mini-menu-card" onClick={() => onOpenMenu(m.id)}>
                      {imageList(m.image_url).length ? (
                        <ImageSlideshow value={m.image_url} alt={m.nama} />
                      ) : (
                        <div className="mini-menu-img-placeholder"></div>
                      )}
                      <div className="mini-menu-info">
                        <h5>{m.nama}</h5>
                        <span className="price">{m.harga || ""}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}