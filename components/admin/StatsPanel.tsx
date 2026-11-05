"use client";

import { useEffect, useMemo, useState } from "react";
import { Donut, HBars, Legend, Sparkline, TimeChart, fmtDate, type Row } from "@/components/admin/Charts";

type Point = { date: string; visitors: number; registrations: number; accounts: number; wishlist: number; wishlistTotal: number };
type Stats = {
  start: string;
  today: string;
  series: Point[];
  visitors: { trackingSince: string | null; today: number; last7: number; last30: number; allTime: number; visitDays: number };
  users: { total: number; pembeli: number; toko: number; pending: number; baru7: number; baru30: number };
  stores: { total: number; approved: number; pending: number; rejected: number };
  content: { menu: number; testimoni: number; testimoniPending: number; faq: number };
  wishlist: {
    total: number; users: number; toko: number; menu: number;
    perToko: { id: number; nama: string; wishlist_toko: number; wishlist_menu: number; total: number }[];
    perMenu: { id: number; nama: string; store_nama: string | null; total: number }[];
  };
};

const nf = new Intl.NumberFormat("id-ID");
const C = { green: "#2C6B52", deep: "#0F2B22", mustard: "#E8A33D", pink: "#B23A55", sage: "#8DB5A1" };
const RANGES = [
  { id: 7, label: "7 hari" },
  { id: 30, label: "30 hari" },
  { id: 90, label: "90 hari" },
  { id: 0, label: "Sejak awal" },
];

function Kpi({ label, value, note, spark, color }: { label: string; value: number; note?: string; spark: number[]; color: string }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{nf.format(value)}</div>
      <div className="stat-note">{note || " "}</div>
      <Sparkline values={spark} color={color} />
    </div>
  );
}

function Panel({ title, sub, legend, children }: { title: string; sub?: string; legend?: { label: string; color: string }[]; children: React.ReactNode }) {
  return (
    <section className="chart-card">
      <header>
        <div>
          <h4>{title}</h4>
          {sub && <p>{sub}</p>}
        </div>
        {legend && <Legend items={legend} />}
      </header>
      {children}
    </section>
  );
}

export default function StatsPanel({ onAuthFail }: { onAuthFail: () => void }) {
  const [s, setS] = useState<Stats | null>(null);
  const [error, setError] = useState(false);
  const [range, setRange] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch("/admin/api/stats")
      .then(async (r) => {
        if (r.status === 401) return onAuthFail();
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (alive) setS(d);
      })
      .catch(() => alive && setError(true));
    return () => { alive = false; };
  }, [onAuthFail]);

  const view = useMemo(() => (s ? (range ? s.series.slice(-range) : s.series) : []), [s, range]);

  if (error) return <p className="hint">Gagal memuat statistik.</p>;
  if (!s) return <p className="hint">Memuat statistik…</p>;

  const last = (n: number) => s.series.slice(-n);
  const sum = (rows: Point[], k: "visitors" | "registrations" | "wishlist") => rows.reduce((a, r) => a + r[k], 0);
  const inRange = (k: "visitors" | "registrations" | "wishlist") => sum(view, k);
  const rangeLabel = range ? `${range} hari terakhir` : "sejak awal";

  return (
    <>
      <div className="stats-toolbar">
        <p className="hint" style={{ margin: 0 }}>
          Data sejak <strong>{fmtDate(s.start, true)}</strong>
        </p>
        <div className="range-pills" role="tablist" aria-label="Rentang waktu">
          {RANGES.map((r) => (
            <button key={r.id} type="button" className={range === r.id ? "active" : ""} onClick={() => setRange(r.id)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="stat-grid">
        <Kpi label="Pengunjung hari ini" value={s.visitors.today}
          note={`${nf.format(s.visitors.last7)} unik dalam 7 hari`} spark={last(14).map((r) => r.visitors)} color={C.green} />
        <Kpi label="Total akun" value={s.users.total}
          note={`${nf.format(s.users.baru7)} baru dalam 7 hari`} spark={last(30).map((r) => r.accounts)} color={C.deep} />
        <Kpi label="Daftar 7 hari terakhir" value={s.users.baru7}
          note={`${nf.format(s.users.baru30)} dalam 30 hari`} spark={last(14).map((r) => r.registrations)} color={C.mustard} />
        <Kpi label="Total wishlist" value={s.wishlist.total}
          note={`dari ${nf.format(s.wishlist.users)} pengguna`} spark={last(30).map((r) => r.wishlistTotal)} color={C.pink} />
      </div>

      <Panel
        title="Pengunjung website"
        legend={[{ label: "Pengunjung per hari", color: C.green }]}
      >
        <div className="panel-figures">
          <div><b>{nf.format(s.visitors.allTime)}</b><span>Pengunjung unik</span></div>
          <div><b>{nf.format(inRange("visitors"))}</b><span>Kunjungan ({rangeLabel})</span></div>
        </div>
        <TimeChart data={view as unknown as Row[]} series={[{ key: "visitors", label: "Pengunjung", color: C.green, type: "area" }]} />
      </Panel>

      <Panel
        title="Pendaftaran akun"
        legend={[{ label: "Daftar per hari", color: C.mustard }]}
      >
        <div className="panel-figures">
          <div><b>{nf.format(s.users.total)}</b><span>Total akun</span></div>
          <div><b>{nf.format(inRange("registrations"))}</b><span>Daftar ({rangeLabel})</span></div>
        </div>
        <TimeChart
          data={view as unknown as Row[]}
          series={[{ key: "registrations", label: "Daftar baru", color: C.mustard, type: "bar" }]}
        />
      </Panel>

      <div className="chart-trio">
        <Panel title="Jenis akun">
          <Donut centerLabel="akun" parts={[
            { label: "Pengguna", value: s.users.pembeli, color: C.green },
            { label: "Toko", value: s.users.toko, color: C.mustard },
          ]} />
          {s.users.pending > 0 && <p className="hint" style={{ margin: "10px 0 0" }}>{s.users.pending} akun toko menunggu approval.</p>}
        </Panel>
        <Panel title="Status toko">
          <Donut centerLabel="toko" parts={[
            { label: "Disetujui", value: s.stores.approved, color: C.green },
            { label: "Menunggu", value: s.stores.pending, color: C.mustard },
            { label: "Ditolak", value: s.stores.rejected, color: C.pink },
          ]} />
        </Panel>
        <Panel title="Isi wishlist">
          <Donut centerLabel="wishlist" parts={[
            { label: "Menu", value: s.wishlist.menu, color: C.pink },
            { label: "Toko", value: s.wishlist.toko, color: C.sage },
          ]} />
        </Panel>
      </div>

      <Panel
        title="Aktivitas wishlist"
        legend={[{ label: "Ditambahkan per hari", color: C.pink }]}
      >
        <div className="panel-figures">
          <div><b>{nf.format(s.wishlist.total)}</b><span>Total wishlist</span></div>
          <div><b>{nf.format(inRange("wishlist"))}</b><span>Ditambahkan ({rangeLabel})</span></div>
        </div>
        <TimeChart
          data={view as unknown as Row[]}
          series={[{ key: "wishlist", label: "Ditambahkan", color: C.pink, type: "bar" }]}
        />
      </Panel>

      <div className="chart-duo">
        <Panel title="Toko paling banyak di-wishlist">
          <HBars color={C.green} empty="Belum ada wishlist."
            items={s.wishlist.perToko.slice(0, 8).map((r) => ({ label: r.nama, sub: `${r.wishlist_toko} toko · ${r.wishlist_menu} menu`, value: r.total }))} />
        </Panel>
        <Panel title="Menu paling banyak di-wishlist">
          <HBars color={C.pink} empty="Belum ada wishlist."
            items={s.wishlist.perMenu.slice(0, 8).map((r) => ({ label: r.nama, sub: r.store_nama, value: r.total }))} />
        </Panel>
      </div>

      <details className="chart-card stat-details">
        <summary>Tabel lengkap wishlist per toko dan per menu</summary>
        <div className="stat-two">
          <table className="admin-table">
            <thead><tr><th>Toko</th><th>Toko</th><th>Menu</th><th>Total</th></tr></thead>
            <tbody>
              {s.wishlist.perToko.length === 0 && <tr><td colSpan={4} className="muted">Belum ada toko.</td></tr>}
              {s.wishlist.perToko.map((r) => (
                <tr key={r.id}><td>{r.nama}</td><td>{r.wishlist_toko}</td><td>{r.wishlist_menu}</td><td><strong>{r.total}</strong></td></tr>
              ))}
            </tbody>
          </table>
          <table className="admin-table">
            <thead><tr><th>Menu</th><th>Toko</th><th>Wishlist</th></tr></thead>
            <tbody>
              {s.wishlist.perMenu.length === 0 && <tr><td colSpan={3} className="muted">Belum ada menu.</td></tr>}
              {s.wishlist.perMenu.map((r) => (
                <tr key={r.id}><td>{r.nama}</td><td>{r.store_nama || "-"}</td><td><strong>{r.total}</strong></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <h3 className="sub-heading">Konten website</h3>
      <div className="stat-grid">
        <Kpi label="Toko" value={s.stores.total} note={`${s.stores.approved} disetujui · ${s.stores.pending} menunggu`} spark={[]} color={C.green} />
        <Kpi label="Menu" value={s.content.menu} spark={[]} color={C.green} />
        <Kpi label="Testimoni" value={s.content.testimoni} note={`${s.content.testimoniPending} menunggu approval`} spark={[]} color={C.green} />
        <Kpi label="FAQ" value={s.content.faq} spark={[]} color={C.green} />
      </div>
    </>
  );
}
