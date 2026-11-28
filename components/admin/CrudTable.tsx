"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LISTS, parseImageList } from "@/lib/adminConfig";
import FieldInput from "@/components/admin/FieldInput";
import { SkeletonTable } from "@/components/admin/Skeleton";
import SitePreview, { LIST_TARGET, type PreviewPatch } from "@/components/admin/SitePreview";

type Item = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Store = { id: number; nama: string };

function toMin(v?: string) {
  const m = String(v || "").match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
function isOpen(s: Item) {
  const o = toMin(s.jam_buka), c = toMin(s.jam_tutup);
  if (o === null || c === null || o === c) return false;
  const n = new Date();
  const cur = n.getHours() * 60 + n.getMinutes();
  return o < c ? cur >= o && cur < c : cur >= o || cur < c;
}
function fmt(v?: string) {
  const m = toMin(v);
  if (m === null) return "-";
  const d = new Date();
  d.setHours(Math.floor(m / 60), m % 60, 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
const cut = (v: unknown) => {
  if (v == null) return "-";
  const s = String(v);
  return s.length > 60 ? s.slice(0, 60) + "…" : s;
};
const badge = (bg: string, fg: string, label: string) => (
  <span style={{ background: bg, color: fg, padding: "4px 10px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600 }}>
    {label}
  </span>
);

export default function CrudTable({
  listKey, stores, onChanged, onAuthFail, onConfirm, reloadSignal,
}: {
  listKey: string;
  stores: Store[];
  onChanged?: () => void;
  onAuthFail: () => void;
  onConfirm: (message: string, ok: () => void) => void;
  reloadSignal?: number;
}) {
  const cfg = LISTS[listKey];
  const [items, setItems] = useState<Item[] | null>(null);
  const [editing, setEditing] = useState<{ item: Item | null; values: Item } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/admin/api/${cfg.endpoint}`);
    if (res.status === 401) return onAuthFail();
    const d = await res.json().catch(() => []);
    setItems(Array.isArray(d) ? d : []);
  }, [cfg.endpoint, onAuthFail]);

  useEffect(() => {
    load();
    if (listKey !== "stores") return;
    const id = window.setInterval(load, 60000);
    return () => window.clearInterval(id);
  }, [load, listKey, reloadSignal]);

  function open(item: Item | null) {
    const values: Item = {};
    cfg.fields.forEach((f) => (values[f.name] = item ? item[f.name] : ""));
    // Nilai hitungan situs (tidak bisa diedit, hanya untuk preview)
    values.rating = item?.rating ?? 0;
    values.ulasan_count = item?.ulasan_count ?? 0;
    values.target_type = item?.target_type ?? "";
    values.target_nama = item?.target_nama ?? "";
    setEditing({ item, values });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const payload: Item = {};
    cfg.fields.forEach((f) => {
      const v = editing.values[f.name];
      payload[f.name] = f.type === "image" ? parseImageList(v) : v ?? "";
    });
    const id = editing.item?.id;
    const res = await fetch(`/admin/api/${cfg.endpoint}${id ? "/" + id : ""}`, {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 401) return onAuthFail();
    if (!res.ok) return alert("Gagal menyimpan.");
    setEditing(null);
    await load();
    onChanged?.();
  }

  function remove(id: number) {
    onConfirm("Hapus item ini?", async () => {
      const res = await fetch(`/admin/api/${cfg.endpoint}/${id}`, { method: "DELETE" });
      if (res.status === 401) return onAuthFail();
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        return alert(d.error || "Gagal menghapus.");
      }
      await load();
      onChanged?.();
    });
  }

  function cell(col: string, item: Item) {
    const val = item[col];
    if (col === "status") {
      const open = isOpen(item);
      return <span className={"status-tag " + (open ? "buka" : "tutup")}>{open ? "Buka" : "Tutup"}</span>;
    }
    if (col === "rating") return Number(val) > 0 ? `★ ${val}` : <span style={{ color: "#5B6B62" }}>Belum ada</span>;
    if (col === "ulasan_count") return `${Number(val) || 0} ulasan`;
    if (col === "target_nama") {
      return val ? (item.target_type === "menu" ? "Menu: " : "Toko: ") + val : <span style={{ color: "#5B6B62" }}>Umum</span>;
    }
    if (col === "jam_buka") return `${fmt(item.jam_buka)} - ${fmt(item.jam_tutup)}`;
    if (col === "approved") {
      return Number(val) === 1 ? badge("#E9F1EA", "#1E4D3B", "Disetujui") : badge("#FCEBD1", "#C9852A", "Menunggu");
    }
    if (col === "approval_status") {
      if (val === "approved") return badge("#E9F1EA", "#1E4D3B", "Disetujui");
      if (val === "rejected") return badge("#F6D9DE", "#B23A55", "Ditolak");
      return badge("#FCEBD1", "#C9852A", "Menunggu");
    }
    if (col === "store_id") {
      const s = stores.find((x) => String(x.id) === String(val));
      return s ? s.nama : <em>Belum dipilih</em>;
    }
    if (col === "image_url") {
      const imgs = parseImageList(val);
      if (!imgs.length) return <span style={{ color: "#5B6B62", fontSize: "0.8rem" }}>Belum ada</span>;
      return (
        <div style={{ position: "relative", width: 48, height: 48 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgs[0]} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }} />
          {imgs.length > 1 && <span className="image-count-badge">{imgs.length}</span>}
        </div>
      );
    }
    return cut(val);
  }

  // Draf yang sedang diisi di form -> dikirim ke situs (iframe) sebagai item pengganti
  const patch = useMemo<PreviewPatch | undefined>(() => {
    if (!editing) return undefined;
    const v = editing.values;
    const base = { ...v, id: editing.item?.id ?? -1 };
    const kind = LIST_TARGET[listKey].kind;
    if (kind === "store") {
      return { kind, item: { ...base, image_url: JSON.stringify(parseImageList(v.image_url)), rating: Number(v.rating) || 0 } };
    }
    if (kind === "menu") {
      return { kind, item: { ...base, image_url: JSON.stringify(parseImageList(v.image_url)), rating: Number(v.rating) || 0, ulasan_count: Number(v.ulasan_count) || 0, store_nama: stores.find((x) => String(x.id) === String(v.store_id))?.nama } };
    }
    if (kind === "testimonial") return { kind, item: { ...base, stars: Number(v.stars) || 5 } };
    return { kind, item: base };
  }, [editing, listKey, stores]);

  return (
    <div className="list-block">
      <div className="list-head">
        <h3 className="sub-heading">Daftar {cfg.title}</h3>
        <button type="button" className="btn-primary add-item-btn" onClick={() => open(null)}>+ Tambah {cfg.title}</button>
      </div>

      {!items ? (
        <SkeletonTable rows={5} cols={Math.min(cfg.columns.length, 5)} />
      ) : (
      <table className="admin-table">
        <tbody>
          {items.length === 0 && (
            <tr><td colSpan={cfg.columns.length + 1} style={{ color: "#5B6B62" }}>Belum ada data.</td></tr>
          )}
          {items.map((item) => (
            <tr key={item.id}>
              {cfg.columns.map((c) => <td key={c}>{cell(c, item)}</td>)}
              <td className="row-actions">
                <button className="edit-btn" onClick={() => open(item)}>Edit</button>
                <button className="delete-btn" onClick={() => remove(item.id)}>Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}

      {editing && (
        <div className="modal-backdrop open" onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div className="modal-wrap">
            <div className="modal">
              <h2>{(editing.item ? "Edit " : "Tambah ") + cfg.title}</h2>
              <form onSubmit={save}>
                {cfg.fields.map((f) => (
                  <FieldInput key={f.name} def={f} value={editing.values[f.name]} stores={stores}
                    onChange={(v) => setEditing({ ...editing, values: { ...editing.values, [f.name]: v } })} />
                ))}
                <div className="modal-actions">
                  <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Batal</button>
                  <button type="submit" className="btn-primary">Simpan</button>
                </div>
              </form>
            </div>

            <aside className="preview-pane modal-preview">
              <div className="preview-pane-label">Live Preview · tampilan situs</div>
              <div className="preview-surface preview-live">
                <SitePreview target={LIST_TARGET[listKey].target} patch={patch} />
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}