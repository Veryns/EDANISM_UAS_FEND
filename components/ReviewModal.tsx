"use client";

import { useState } from "react";
import type { MenuItem, Store } from "@/lib/home";

export default function ReviewModal({
  stores, menu, onClose,
}: { stores: Store[]; menu: MenuItem[]; onClose: () => void }) {
  const [type, setType] = useState<"store" | "menu">("store");
  const [targetId, setTargetId] = useState("");
  const [stars, setStars] = useState("5");
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!targetId) return setErr("Pilih dulu toko atau menu yang mau kamu ulas.");
    const res = await fetch("/api/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ulasan: text.trim(), stars, target_type: type, target_id: targetId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setErr(data.error || "Gagal mengirim ulasan. Coba lagi.");
    setSuccess(data.message);
  }

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <button className="modal-close" aria-label="Tutup" onClick={onClose}>&times;</button>
        <h3 style={{ marginBottom: 16 }}>Tulis Ulasan</h3>

        <p className={"modal-error" + (err ? " show" : "")}>{err}</p>
        <p className={"modal-success" + (success ? " show" : "")}>{success}</p>

        {!success && (
          <form className="modal-form" onSubmit={submit}>
            <div className="field">
              <label htmlFor="reviewTargetType">Ulasan untuk</label>
              <select id="reviewTargetType" value={type} onChange={(e) => { setType(e.target.value as "store" | "menu"); setTargetId(""); }}>
                <option value="store">Toko</option>
                <option value="menu">Menu</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="reviewTargetId">Pilih Toko/Menu</label>
              <select id="reviewTargetId" required value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                <option value="">-- Pilih --</option>
                {type === "menu"
                  ? menu.map((m) => (
                      <option key={m.id} value={m.id}>{m.nama + (m.store_nama ? ` (${m.store_nama})` : "")}</option>
                    ))
                  : stores.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="reviewStars">Rating</label>
              <select id="reviewStars" value={stars} onChange={(e) => setStars(e.target.value)}>
                <option value="5">★★★★★ (5)</option>
                <option value="4">★★★★ (4)</option>
                <option value="3">★★★ (3)</option>
                <option value="2">★★ (2)</option>
                <option value="1">★ (1)</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="reviewText">Ulasan Kamu</label>
              <textarea id="reviewText" rows={4} required placeholder="Ceritakan pengalamanmu..." value={text} onChange={(e) => setText(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-mustard modal-submit">Kirim Ulasan</button>
          </form>
        )}
      </div>
    </div>
  );
}