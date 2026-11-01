"use client";

import { useRef, useState } from "react";

export default function AdminImageManager({
  images,
  onChange,
}: {
  images: string[];
  onChange: (next: string[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cur = Math.max(0, Math.min(index, images.length - 1));

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    let failed = 0;
    const next = [...images];
    for (let i = 0; i < files.length; i++) {
      setStatus(`Mengupload ${i + 1} dari ${files.length}...`);
      const fd = new FormData();
      fd.append("image", files[i]);
      try {
        const res = await fetch("/admin/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error();
        next.push((await res.json()).url);
      } catch {
        failed++;
      }
    }
    onChange(next);
    setStatus(failed ? `${failed} upload gagal.` : `Selesai: ${next.length} gambar.`);
    setBusy(false);
  }

  return (
    <div className="image-manager">
      {images.length > 0 ? (
        <div className="image-manager-viewer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[cur]} alt="Pratinjau gambar" />
          {images.length > 1 && (
            <>
              <button type="button" className="image-manager-arrow image-manager-prev" aria-label="Gambar sebelumnya"
                onClick={() => setIndex((cur - 1 + images.length) % images.length)}>‹</button>
              <button type="button" className="image-manager-arrow image-manager-next" aria-label="Gambar berikutnya"
                onClick={() => setIndex((cur + 1) % images.length)}>›</button>
              <span className="image-manager-counter">{cur + 1} / {images.length}</span>
            </>
          )}
        </div>
      ) : (
        <p className="image-manager-empty">Belum ada gambar.</p>
      )}
      {images.length > 0 && (
        <button type="button" className="btn-outline image-manager-remove"
          onClick={() => onChange(images.filter((_, i) => i !== cur))}>
          Hapus gambar ini
        </button>
      )}
      <div className="image-manager-add-row">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple
          disabled={busy} aria-label="Tambah gambar" onChange={pick} />
        <span className="image-manager-status">{status}</span>
      </div>
    </div>
  );
}