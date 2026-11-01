"use client";

import { useRef, useState } from "react";

export default function ImageManager({
  images,
  onChange,
  max = 10,
  onError,
}: {
  images: string[];
  onChange: (next: string[]) => void;
  max?: number;
  onError: (msg: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    let files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    const slots = max - images.length;
    if (files.length > slots) {
      files = files.slice(0, slots);
      onError(`Maksimal ${max} gambar. Sebagian gambar tidak diupload.`);
    }

    setBusy(true);
    try {
      const results = await Promise.all(
        files.map(async (file) => {
          const fd = new FormData();
          fd.append("image", file);
          const res = await fetch("/api/toko/upload", { method: "POST", body: fd });
          if (!res.ok) throw new Error("upload");
          return (await res.json()).url as string;
        })
      );
      onChange([...images, ...results.filter(Boolean)]);
    } catch {
      onError("Sebagian atau semua gambar gagal diupload. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="img-manager">
      {images.map((url, idx) => (
        <div className="img-manager-item" key={url + idx}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`Gambar ${idx + 1}`} />
          {idx === 0 && <span className="img-manager-cover">Sampul</span>}
          <button
            type="button"
            className="img-manager-remove"
            title="Hapus gambar"
            onClick={() => onChange(images.filter((_, i) => i !== idx))}
          >
            &times;
          </button>
        </div>
      ))}
      {images.length < max && (
        <button type="button" className="img-manager-add" disabled={busy} onClick={() => fileRef.current?.click()}>
          <span className="plus">{busy ? "⏳" : "+"}</span>
          <span>{busy ? "Mengupload..." : "Tambah"}</span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        style={{ display: "none" }}
        onChange={pick}
      />
    </div>
  );
}