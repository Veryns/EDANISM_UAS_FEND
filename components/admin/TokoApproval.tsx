"use client";

import { useCallback, useEffect, useState } from "react";

type Pending = {
  user_id: number; nama: string; email: string; created_at: string;
  store_nama: string; store_alamat?: string | null;
};

export default function TokoApproval({
  onCount, onAuthFail, onConfirm, onApproved,
}: {
  onCount: (n: number) => void;
  onAuthFail: () => void;
  onConfirm: (message: string, ok: () => void) => void;
  onApproved: () => void;
}) {
  const [items, setItems] = useState<Pending[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/admin/api/toko-pending");
    if (res.status === 401) return onAuthFail();
    const d = await res.json().catch(() => []);
    const list = Array.isArray(d) ? d : [];
    setItems(list);
    onCount(list.length);
  }, [onAuthFail, onCount]);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 60000);
    return () => window.clearInterval(id);
  }, [load]);

  function act(userId: number, kind: "approve" | "reject") {
    onConfirm(
      kind === "approve"
        ? "Setujui pendaftaran toko ini? Toko akan langsung tampil ke publik."
        : "Tolak pendaftaran toko ini?",
      async () => {
        const res = await fetch(`/admin/api/toko-pending/${userId}/${kind}`, { method: "POST" });
        if (res.status === 401) return onAuthFail();
        if (!res.ok) return alert(kind === "approve" ? "Gagal menyetujui pendaftaran." : "Gagal menolak pendaftaran.");
        await load();
        if (kind === "approve") onApproved();
      }
    );
  }

  return (
    <table className="admin-table">
      <thead>
        <tr><th>Toko</th><th>Alamat</th><th>Pemilik</th><th>Email</th><th>Tanggal</th><th /></tr>
      </thead>
      <tbody>
        {items.length === 0 && (
          <tr><td colSpan={6} style={{ color: "#5B6B62" }}>Tidak ada pendaftaran yang menunggu.</td></tr>
        )}
        {items.map((i) => (
          <tr key={i.user_id}>
            <td>{i.store_nama}</td>
            <td>{i.store_alamat || "-"}</td>
            <td>{i.nama}</td>
            <td>{i.email}</td>
            <td>{String(i.created_at)}</td>
            <td className="row-actions">
              <button onClick={() => act(i.user_id, "approve")}
                style={{ background: "none", border: "none", color: "#1E4D3B", fontWeight: 600, cursor: "pointer", padding: "4px 8px" }}>
                Approve
              </button>
              <button onClick={() => act(i.user_id, "reject")}
                style={{ background: "none", border: "none", color: "#B23A55", fontWeight: 600, cursor: "pointer", padding: "4px 8px" }}>
                Reject
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}