"use client";

import { useEffect, useState } from "react";
import { CONTENT, parseImageList } from "@/lib/adminConfig";
import FieldInput from "@/components/admin/FieldInput";
import { SkeletonForm } from "@/components/admin/Skeleton";
import SitePreview, { CONTENT_TARGET } from "@/components/admin/SitePreview";

export default function ContentForm({ contentKey, onAuthFail }: { contentKey: string; onAuthFail: () => void }) {
  const cfg = CONTENT[contentKey];
  const [data, setData] = useState<Record<string, unknown>>({});
  const [status, setStatus] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/admin/api/content/${contentKey}`)
      .then((r) => {
        if (r.status === 401) onAuthFail();
        return r.json();
      })
      .then((d) => setData(d || {}))
      .catch(() => {})
      .finally(() => setLoaded(true));
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

  if (!loaded) return <SkeletonForm fields={Math.min(cfg.fields.length, 5)} />;

  return (
    <div className="form-preview-row">
      <form className="content-form" onSubmit={save}>
        <h3 className="sub-heading">{cfg.title}</h3>
        <div className="fields">
          {cfg.fields.map((f) => (
            <FieldInput key={f.name} def={f} value={data[f.name]} onChange={(v) => setData({ ...data, [f.name]: v })} />
          ))}
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary">Save Changes</button>
          <span className="save-status">{status}</span>
        </div>
      </form>

      <aside className="preview-pane">
        <div className="preview-pane-label">Live Preview · tampilan situs</div>
        <div className="preview-surface preview-live">
          <SitePreview target={CONTENT_TARGET[contentKey] || "beranda"} content={{ key: contentKey, data }} />
        </div>
      </aside>
    </div>
  );
}