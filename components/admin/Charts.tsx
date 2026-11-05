"use client";

import { useEffect, useId, useRef, useState } from "react";

const nf = new Intl.NumberFormat("id-ID");

export function fmtDate(date: string, withYear = false) {
  return new Date(date + "T00:00:00Z").toLocaleDateString("id-ID", {
    day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC",
  });
}

function niceMax(v: number) {
  if (v <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(v / 4)));
  const m = [1, 2, 2.5, 5, 10].find((k) => k * step * 4 >= v) ?? 10;
  return m * step * 4;
}

/* ------------------------------------------------------------------ */
/* TimeChart: area / bar / line per hari, mendukung 2 sumbu y          */
/* ------------------------------------------------------------------ */
export type Row = { date: string } & Record<string, number | string>;
export type SeriesDef = {
  key: string; label: string; color: string;
  type: "area" | "bar" | "line"; axis?: "l" | "r";
};

export function TimeChart({ data, series, height = 260 }: { data: Row[]; series: SeriesDef[]; height?: number }) {
  const uid = useId().replace(/:/g, "");
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.max(280, el.clientWidth)));
    ro.observe(el);
    setWidth(Math.max(280, el.clientWidth));
    return () => ro.disconnect();
  }, []);

  const n = data.length;
  const hasRight = series.some((s) => s.axis === "r");
  const pl = 40, pr = hasRight ? 44 : 14, pt = 12, pb = 26;
  const w = width - pl - pr;
  const h = height - pt - pb;
  const band = n > 0 ? w / n : w;

  const maxOf = (axis: "l" | "r") =>
    niceMax(Math.max(1, ...data.flatMap((r) => series.filter((s) => (s.axis ?? "l") === axis).map((s) => Number(r[s.key]) || 0))));
  const maxL = maxOf("l");
  const maxR = hasRight ? maxOf("r") : 1;

  const xc = (i: number) => pl + (i + 0.5) * band;
  const yv = (v: number, axis: "l" | "r") => pt + h - (v / (axis === "r" ? maxR : maxL)) * h;
  const spansYears = n > 0 && data[0].date.slice(0, 4) !== data[n - 1].date.slice(0, 4);

  const xTicks: number[] = [];
  const tickCount = Math.min(n, width < 480 ? 4 : 7);
  for (let i = 0; i < tickCount; i++) xTicks.push(tickCount === 1 ? 0 : Math.round((i * (n - 1)) / (tickCount - 1)));

  function path(s: SeriesDef) {
    const ax = s.axis ?? "l";
    return data.map((r, i) => `${i ? "L" : "M"}${xc(i).toFixed(1)},${yv(Number(r[s.key]) || 0, ax).toFixed(1)}`).join("");
  }

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const i = Math.floor(((e.clientX - box.left) - pl) / band);
    setHover(i >= 0 && i < n ? i : null);
  }

  if (n === 0) return <div className="chart-empty">Belum ada data.</div>;

  const tipLeft = hover !== null ? Math.min(Math.max(xc(hover), 90), width - 90) : 0;

  return (
    <div className="chart-wrap" ref={wrap} style={{ height }}>
      <svg width={width} height={height} role="img" aria-label={series.map((s) => s.label).join(", ")}
        onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          {series.filter((s) => s.type === "area").map((s) => (
            <linearGradient key={s.key} id={`${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity=".32" />
              <stop offset="100%" stopColor={s.color} stopOpacity=".02" />
            </linearGradient>
          ))}
        </defs>

        {[0, 1, 2, 3, 4].map((t) => {
          const y = pt + h - (t / 4) * h;
          return (
            <g key={t}>
              <line x1={pl} x2={pl + w} y1={y} y2={y} className="chart-grid" />
              <text x={pl - 8} y={y + 4} textAnchor="end" className="chart-axis">{nf.format((maxL / 4) * t)}</text>
              {hasRight && (
                <text x={pl + w + 8} y={y + 4} className="chart-axis">{nf.format((maxR / 4) * t)}</text>
              )}
            </g>
          );
        })}

        {xTicks.map((i) => (
          <text key={i} x={xc(i)} y={height - 8} textAnchor="middle" className="chart-axis">
            {fmtDate(data[i].date, spansYears)}
          </text>
        ))}

        {series.filter((s) => s.type === "bar").map((s) =>
          data.map((r, i) => {
            const v = Number(r[s.key]) || 0;
            const bw = Math.max(1.5, Math.min(band * 0.7, 26));
            const y = yv(v, s.axis ?? "l");
            return (
              <rect key={s.key + i} x={xc(i) - bw / 2} y={y} width={bw} height={Math.max(0, pt + h - y)}
                rx={Math.min(3, bw / 2)} fill={s.color} opacity={hover === null || hover === i ? 1 : 0.45} />
            );
          })
        )}

        {series.filter((s) => s.type === "area").map((s) => (
          <g key={s.key}>
            <path d={`${path(s)}L${xc(n - 1).toFixed(1)},${pt + h}L${xc(0).toFixed(1)},${pt + h}Z`} fill={`url(#${uid}-${s.key})`} />
            <path d={path(s)} fill="none" stroke={s.color} strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />
          </g>
        ))}

        {series.filter((s) => s.type === "line").map((s) => (
          <path key={s.key} d={path(s)} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        ))}

        {hover !== null && (
          <g>
            <line x1={xc(hover)} x2={xc(hover)} y1={pt} y2={pt + h} className="chart-cursor" />
            {series.filter((s) => s.type !== "bar").map((s) => (
              <circle key={s.key} cx={xc(hover)} cy={yv(Number(data[hover][s.key]) || 0, s.axis ?? "l")}
                r={4} fill="#fff" stroke={s.color} strokeWidth={2} />
            ))}
          </g>
        )}
      </svg>

      {hover !== null && (
        <div className="chart-tip" style={{ left: tipLeft, top: pt }}>
          <strong>{fmtDate(data[hover].date, true)}</strong>
          {series.map((s) => (
            <span key={s.key}>
              <i style={{ background: s.color }} /> {s.label}: <b>{nf.format(Number(data[hover][s.key]) || 0)}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="chart-legend">
      {items.map((i) => (
        <span key={i.label}><i style={{ background: i.color }} />{i.label}</span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Donut                                                               */
/* ------------------------------------------------------------------ */
export function Donut({ parts, centerLabel }: { parts: { label: string; value: number; color: string }[]; centerLabel: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  const r = 50, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="donut">
      <svg viewBox="0 0 140 140" width="140" height="140" role="img" aria-label={parts.map((p) => `${p.label} ${p.value}`).join(", ")}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#EFEADB" strokeWidth="20" />
        {total > 0 && parts.filter((p) => p.value > 0).map((p) => {
          const len = (p.value / total) * c;
          const el = (
            <circle key={p.label} cx="70" cy="70" r={r} fill="none" stroke={p.color} strokeWidth="20"
              strokeDasharray={`${Math.max(0, len - 2)} ${c - Math.max(0, len - 2)}`}
              strokeDashoffset={-offset} transform="rotate(-90 70 70)" />
          );
          offset += len;
          return el;
        })}
        <text x="70" y="68" textAnchor="middle" className="donut-total">{nf.format(total)}</text>
        <text x="70" y="86" textAnchor="middle" className="donut-sub">{centerLabel}</text>
      </svg>
      <ul>
        {parts.map((p) => (
          <li key={p.label}>
            <i style={{ background: p.color }} />
            <span>{p.label}</span>
            <b>{nf.format(p.value)}</b>
            <em>{total ? Math.round((p.value / total) * 100) : 0}%</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bar horizontal (peringkat)                                          */
/* ------------------------------------------------------------------ */
export function HBars({ items, color, empty }: { items: { label: string; sub?: string | null; value: number }[]; color: string; empty: string }) {
  const max = Math.max(0, ...items.map((i) => i.value));
  if (max === 0) return <div className="chart-empty">{empty}</div>;
  return (
    <ol className="hbars">
      {items.map((i) => (
        <li key={i.label + i.sub}>
          <div className="hbar-head">
            <span>{i.label}{i.sub ? <small> · {i.sub}</small> : null}</span>
            <b>{nf.format(i.value)}</b>
          </div>
          <div className="hbar-track"><div style={{ width: `${(i.value / max) * 100}%`, background: color }} /></div>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkline untuk kartu KPI                                           */
/* ------------------------------------------------------------------ */
export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const uid = useId().replace(/:/g, "");
  if (values.length < 2) return <div className="spark" />;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * 100, 32 - (v / max) * 30]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("");
  return (
    <svg className="spark" viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line}L100,34L0,34Z`} fill={`url(#${uid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}
