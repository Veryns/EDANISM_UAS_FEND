// Skeleton placeholders shown while admin data loads (replaces spinners / blank states).
type Size = number | string;

export function Skel({ w = "100%", h = 14, r, className = "" }: { w?: Size; h?: Size; r?: Size; className?: string }) {
  return <span className={"sk " + className} style={{ width: w, height: h, borderRadius: r }} aria-hidden="true" />;
}

export function SkeletonTable({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <table className="admin-table" aria-busy="true" aria-label="Loading">
      <tbody>
        {Array.from({ length: rows }, (_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }, (_, c) => (
              <td key={c}><Skel w={c === 0 ? "70%" : `${45 + ((r + c * 3) % 4) * 12}%`} /></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="form-preview-row" aria-busy="true" aria-label="Loading">
      <div className="content-form">
        <Skel w={140} h={12} className="sk-gap" />
        <div className="fields">
          {Array.from({ length: fields }, (_, i) => (
            <div key={i} className={"sk-field field" + (i === 1 ? " wide" : "")}>
              <Skel w={90} h={10} />
              <Skel h={i === 1 ? 64 : 32} r={8} />
            </div>
          ))}
        </div>
        <Skel w={120} h={32} r={999} />
      </div>
      <div className="preview-pane">
        <Skel w={80} h={10} className="sk-gap" />
        <Skel h={150} r={8} />
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="stat-grid">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="stat-card">
            <Skel w="55%" h={10} />
            <Skel w="40%" h={28} className="sk-gap-sm" />
            <Skel w="70%" h={10} />
            <Skel h={34} className="sk-gap-sm" />
          </div>
        ))}
      </div>
      <div className="chart-card">
        <Skel w={180} h={14} className="sk-gap" />
        <Skel h={240} r={8} />
      </div>
      <div className="chart-trio">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="chart-card"><Skel w={120} h={14} className="sk-gap" /><Skel h={110} r={8} /></div>
        ))}
      </div>
    </div>
  );
}

// Whole admin shell, used before the login check finishes.
export function SkeletonShell() {
  return (
    <div className="adm" aria-busy="true" aria-label="Loading">
      <aside className="adm-side">
        <div className="adm-brand"><Skel w={32} h={32} r={8} /><Skel w={110} h={14} /></div>
        <nav className="adm-nav">
          {[3, 5, 3].map((n, g) => (
            <div key={g} className="adm-group">
              <Skel w={64} h={10} className="sk-gap-sm" />
              {Array.from({ length: n - 1 }, (_, i) => (
                <div key={i} className="adm-link"><Skel w={18} h={18} r={5} /><Skel w={`${50 + ((g + i) % 3) * 12}%`} /></div>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="adm-body">
        <header className="adm-top"><Skel w={28} h={28} r={8} /><Skel w={160} h={12} /></header>
        <main className="adm-main">
          <SkeletonStats />
        </main>
      </div>
    </div>
  );
}
