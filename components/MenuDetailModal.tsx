"use client";

import ImageSlideshow from "@/components/ImageSlideshow";
import { imageList, type MenuItem } from "@/lib/home";

export default function MenuDetailModal({
  menu, onClose, onOpenStore,
}: { menu?: MenuItem; onClose: () => void; onOpenStore: (id: number) => void }) {
  return (
    <div className={"modal-backdrop" + (menu ? " active" : "")} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-lg">
        <button className="modal-close" onClick={onClose}>&times;</button>
        {menu && (
          <>
            <div className="detail-hero">
              {imageList(menu.image_url).length ? (
                <ImageSlideshow value={menu.image_url} alt={menu.nama} />
              ) : (
                <div className="detail-hero-placeholder">Ceritanya Gambar Menu</div>
              )}
            </div>
            <div className="detail-content">
              <h3>{menu.nama}</h3>
              <p className="menu-detail-price">{menu.harga || ""}</p>
              <p>{menu.deskripsi || "Tidak ada deskripsi untuk menu ini."}</p>
              <div className="detail-store-box">
                {menu.store_id ? (
                  <div className="detail-store-link" onClick={() => onOpenStore(menu.store_id as number)}>
                    <div>
                      <strong>{menu.store_nama || ""}</strong>
                      <p className="meta" style={{ margin: "2px 0 0" }}>{menu.store_alamat || ""}</p>
                    </div>
                    <span className="link-arrow no-arrow">Lihat Toko</span>
                  </div>
                ) : (
                  <p className="meta">Toko belum ditentukan.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}