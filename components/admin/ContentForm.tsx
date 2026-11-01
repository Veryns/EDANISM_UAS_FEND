"use client";

import { useEffect, useState } from "react";
import { CONTENT, parseImageList } from "@/lib/adminConfig";
import FieldInput from "@/components/admin/FieldInput";

function renderPreview(key: string, d: Record<string, unknown>, images: string[]) {
  const s = (k: string) => String(d[k] ?? "");
  switch (key) {
    case "hero":
      return (
        <>
          {s("badge") && <span className="pv-badge">{s("badge")}</span>}
          <h4 className="pv-heading">{s("heading")}</h4>
          <p className="pv-sub">{s("subheading")}</p>
          <div className="pv-search">{s("search_placeholder")}</div>
          <div className="pv-actions">
            {s("cta_primary") && <span className="pv-btn pv-btn-mustard">{s("cta_primary")}</span>}
            {s("cta_secondary") && <span className="pv-btn pv-btn-outline">{s("cta_secondary")}</span>}
          </div>
        </>
      );
    case "toko_populer":
      return (
        <>
          <h4 className="pv-heading">{s("heading")}</h4>
          <p className="pv-sub">{s("subheading")}</p>
          <span className="pv-link">{s("link_text")} →</span>
        </>
      );
    case "menu_section":
    case "history":
      return (
        <>
          <h4 className="pv-heading">{s("heading")}</h4>
          <p className="pv-sub">{s("subheading") || s("text")}</p>
        </>
      );
    case "about":
      return (
        <>
          {images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="pv-img" src={images[0]} alt="" />
          ) : (
            <div className="pv-img-placeholder">{s("media_text") || "Belum ada gambar"}</div>
          )}
          <span className="pv-eyebrow">{s("eyebrow")}</span>
          <h4 className="pv-heading">{s("heading")}</h4>
          <p className="pv-sub">{s("description")}</p>
          <div className="pv-pill-row">
            {["pill_1", "pill_2", "pill_3"].map((p) => s(p) && <span key={p} className="pv-pill">{s(p)}</span>)}
          </div>
        </>
      );
    case "testimonial_section":
      return (
        <>
          <span className="pv-eyebrow">{s("eyebrow")}</span>
          <h4 className="pv-heading">{s("heading")}</h4>
          <div className="pv-actions"><span className="pv-btn pv-btn-mustard">{s("cta")}</span></div>
        </>
      );
    case "cari_toko":
      return (
        <div className="pv-dark-box">
          <span className="pv-eyebrow mustard">{s("eyebrow")}</span>
          <h4 className="pv-heading">{s("heading")}</h4>
          <p>{s("subheading")}</p>
        </div>
      );
    case "faq_section":
      return (
        <>
          <span className="pv-eyebrow">{s("eyebrow")}</span>
          <h4 className="pv-heading">{s("heading")}</h4>
        </>
      );
    case "contact":
      return (
        <>
          <span className="pv-eyebrow">{s("eyebrow")}</span>
          <h4 className="pv-heading">{s("heading")}</h4>
          <p className="pv-sub">{s("note")}</p>
          <div className="pv-card">
            <p>✉️ {s("email")}</p>
            <p>💬 {s("whatsapp")}</p>
            <p>🕒 {s("hours")}</p>
          </div>
        </>
      );
    case "footer":
      return (
        <div className="pv-footer-mock">
          <strong>{s("tagline")}</strong>
          {s("social_text")}<br />
          {s("help_email")} · {s("help_whatsapp")}<br />
          {s("legal_terms_label")} · {s("legal_privacy_label")}<br />
          {s("copyright")}
        </div>
      );
    case "site":
      return (
        <>
          <div className="pv-browser-tab"><span className="dot" />{s("site_title") || "Judul tab"}</div>
          <h4 className="pv-heading" style={{ marginTop: 12 }}>{s("logo_text")}</h4>
        </>
      );
    default:
      return <p className="pv-empty">Belum ada preview.</p>;
  }
}

export default function ContentForm({ contentKey, onAuthFail }: { contentKey: string; onAuthFail: () => void }) {
  const cfg = CONTENT[contentKey];
  const [data, setData] = useState<Record<string, unknown>>({});
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch(`/admin/api/content/${contentKey}`)
      .then((r) => {
        if (r.status === 401) onAuthFail();
        return r.json();
      })
      .then((d) => setData(d || {}))
      .catch(() => {});
  }, [contentKey, onAuthFail]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Menyimpan...");
    const payload: Record<string, unknown> = {};
    cfg.fields.forEach((f) => {
      const v = data[f.name];
      payload[f.name] = f.type === "image" ? parseImageList(v) : v ?? "";
    });
    const res = await fetch(`/admin/api/content/${contentKey}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 401) return onAuthFail();
    setStatus(res.ok ? "Tersimpan ✓" : "Gagal menyimpan.");
    if (res.ok) setTimeout(() => setStatus(""), 2000);
  }

  return (
    <div className="form-preview-row">
      <form className="content-form" onSubmit={save}>
        <h3 className="sub-heading">{cfg.title}</h3>
        {cfg.fields.map((f) => (
          <FieldInput key={f.name} def={f} value={data[f.name]} onChange={(v) => setData({ ...data, [f.name]: v })} />
        ))}
        <div className="form-actions">
          <button type="submit" className="btn-primary">Save Changes</button>
          <span className="save-status">{status}</span>
        </div>
      </form>

      <aside className="preview-pane">
        <div className="preview-pane-label">Live Preview</div>
        <div className="preview-surface">
          {renderPreview(contentKey, data, parseImageList(data.images))}
        </div>
      </aside>
    </div>
  );
}