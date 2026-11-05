"use client";

import { Fragment, useCallback, useEffect, useState } from "react";

type WishItem = { type: "menu" | "store"; id: number; nama: string; created_at: string };
type U = {
  id: number; nama: string; email: string; role: string; status: string; created_at: string;
  store_nama: string | null; wishlist_count: number; wishlist: WishItem[];
};

const ROLE: Record<string, string> = { user: "Pengguna", toko: "Toko" };
const STATUS: Record<string, string> = { approved: "Aktif", pending: "Menunggu", rejected: "Ditolak" };
const fmt = (v: string) =>
  new Date(v).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function UserList({ onAuthFail }: { onAuthFail: () => void }) {
  const [users, setUsers] = useState<U[] | null>(null);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (role) params.set("role", role);
    try {
      const res = await fetch("/admin/api/users?" + params);
      if (res.status === 401) return onAuthFail();
      if (!res.ok) throw new Error();
      setUsers(await res.json());
      setError(false);
    } catch {
      setError(true);
    }
  }, [q, role, onAuthFail]);

  useEffect(() => {
    const id = window.setTimeout(load, 250);
    return () => window.clearTimeout(id);
  }, [load]);

  return (
    <>
      <div className="user-filter">
        <input type="search" placeholder="Cari nama atau email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Semua akun</option>
          <option value="user">Pengguna</option>
          <option value="toko">Toko</option>
        </select>
        <span className="hint" style={{ margin: 0 }}>{users ? `${users.length} akun` : ""}</span>
      </div>

      {error && <p className="hint">Gagal memuat data akun.</p>}

      <table className="admin-table">
        <thead>
          <tr><th>Nama</th><th>Email</th><th>Jenis</th><th>Status</th><th>Wishlist</th><th>Terdaftar</th><th /></tr>
        </thead>
        <tbody>
          {users && users.length === 0 && <tr><td colSpan={7} className="muted">Tidak ada akun.</td></tr>}
          {users?.map((u) => (
            <Fragment key={u.id}>
              <tr>
                <td>{u.nama}</td>
                <td>{u.email}</td>
                <td>{ROLE[u.role] || u.role}</td>
                <td>
                  <span className={"status-tag " + (u.status === "approved" ? "buka" : u.status === "rejected" ? "tutup" : "pending")}>
                    {STATUS[u.status] || u.status}
                  </span>
                </td>
                <td>{u.wishlist_count}</td>
                <td>{fmt(u.created_at)}</td>
                <td className="row-actions">
                  <button className="edit-btn" onClick={() => setOpen(open === u.id ? null : u.id)}>
                    {open === u.id ? "Tutup" : "Detail"}
                  </button>
                </td>
              </tr>
              {open === u.id && (
                <tr className="user-detail">
                  <td colSpan={7}>
                    <dl>
                      <dt>ID akun</dt><dd>{u.id}</dd>
                      <dt>Nama</dt><dd>{u.nama}</dd>
                      <dt>Email</dt><dd>{u.email}</dd>
                      <dt>Jenis akun</dt><dd>{ROLE[u.role] || u.role}</dd>
                      <dt>Status</dt><dd>{STATUS[u.status] || u.status}</dd>
                      {u.store_nama && (<><dt>Toko</dt><dd>{u.store_nama}</dd></>)}
                      <dt>Terdaftar</dt><dd>{fmt(u.created_at)}</dd>
                    </dl>
                    <div className="stat-chart-title" style={{ marginTop: 12 }}>Wishlist ({u.wishlist_count})</div>
                    {u.wishlist.length === 0 ? (
                      <p className="muted" style={{ margin: 0 }}>Belum ada wishlist.</p>
                    ) : (
                      <ul className="wish-list">
                        {u.wishlist.map((w) => (
                          <li key={w.type + w.id}>
                            <span className="pv-pill">{w.type === "menu" ? "Menu" : "Toko"}</span> {w.nama}
                            <span className="muted"> · {fmt(w.created_at)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </>
  );
}
