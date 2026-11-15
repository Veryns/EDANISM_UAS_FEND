"use client";

import { useCallback, useEffect, useState } from "react";
import { NAV, TABS } from "@/lib/adminConfig";
import ContentForm from "@/components/admin/ContentForm";
import CrudTable from "@/components/admin/CrudTable";
import TokoApproval from "@/components/admin/TokoApproval";
import StatsPanel from "@/components/admin/StatsPanel";
import UserList from "@/components/admin/UserList";
import Icon from "@/components/admin/Icon";
import { SkeletonShell } from "@/components/admin/Skeleton";

type Store = { id: number; nama: string };

export default function AdminDashboardClient() {
  const [ready, setReady] = useState(false);
  const [username, setUsername] = useState("");
  const [tabId, setTabId] = useState("stats");
  const [viewId, setViewId] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [pending, setPending] = useState(0);
  const [reload, setReload] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ message: string; ok: () => void } | null>(null);

  const authFail = useCallback(() => {
    window.location.href = "/admin/login";
  }, []);

  const loadStores = useCallback(async () => {
    const res = await fetch("/admin/api/stores");
    if (res.status === 401) return authFail();
    const d = await res.json().catch(() => []);
    setStores(Array.isArray(d) ? d : []);
  }, [authFail]);

  const loadPending = useCallback(async () => {
    const res = await fetch("/admin/api/toko-pending");
    if (!res.ok) return;
    const d = await res.json().catch(() => []);
    setPending(Array.isArray(d) ? d.length : 0);
  }, []);

  useEffect(() => {
    document.title = "Content Studio - Administration";
    fetch("/admin/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.loggedIn) return authFail();
        setUsername(d.username);
        setReady(true);
        loadStores();
        loadPending();
      })
      .catch(authFail);
  }, [authFail, loadStores, loadPending]);

  async function logout() {
    const res = await fetch("/admin/auth/logout", { method: "POST" });
    const d = await res.json().catch(() => ({}));
    window.location.href = d.redirect || "/admin/login";
  }

  const askConfirm = useCallback((message: string, ok: () => void) => setConfirm({ message, ok }), []);

  function go(id: string, view = "") {
    setTabId(id);
    setViewId(view);
    setMobileOpen(false);
  }

  function toggleSidebar() {
    if (window.matchMedia("(max-width: 900px)").matches) setMobileOpen((o) => !o);
    else setCollapsed((c) => !c);
  }

  if (!ready) return <SkeletonShell />;

  const tab = TABS.find((t) => t.id === tabId)!;
  const group = NAV.find((g) => g.tabs.includes(tab))!;
  const view = tab.views.find((v) => v.id === viewId) ?? tab.views[0];
  const multi = tab.views.length > 1;

  return (
    <div className={"adm" + (collapsed ? " is-collapsed" : "") + (mobileOpen ? " is-open" : "")}>
      <aside className="adm-side">
        <div className="adm-brand">
          <span className="adm-mark">C</span>
          <span className="adm-brand-name">Content Studio</span>
        </div>

        <nav className="adm-nav" aria-label="Admin">
          {NAV.map((g) => (
            <div key={g.label} className="adm-group">
              <div className="adm-group-label">{g.label}</div>
              {g.tabs.map((t) => (
                <button key={t.id} type="button" className={"adm-link" + (tab.id === t.id ? " active" : "")}
                  aria-current={tab.id === t.id ? "page" : undefined} onClick={() => go(t.id)}>
                  <Icon name={t.icon} />
                  <span>{t.label}</span>
                  {t.id === "stores" && pending > 0 && <span className="adm-badge">{pending}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="adm-user">
          <span className="adm-avatar">{username.slice(0, 1).toUpperCase()}</span>
          <span className="adm-user-name">{username}</span>
          <button type="button" className="adm-icon-btn" onClick={logout} title="Sign out" aria-label="Sign out">
            <Icon name="logout" />
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="adm-scrim" onClick={() => setMobileOpen(false)} />}

      <div className="adm-body">
        <header className="adm-top">
          <button type="button" className="adm-icon-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
            <Icon name="sidebar" />
          </button>
          <h1 className="adm-crumb">{group.label}<i>/</i><strong>{tab.label}</strong></h1>
        </header>

        <main className="adm-main">
          {multi && (
            <div className="range-pills adm-views" role="tablist" aria-label={tab.label}>
              {tab.views.map((v) => (
                <button key={v.id} type="button" role="tab" aria-selected={view.id === v.id}
                  className={view.id === v.id ? "active" : ""} onClick={() => setViewId(v.id)}>
                  {v.label}
                  {v.kind === "approval" && pending > 0 && <span className="adm-badge">{pending}</span>}
                </button>
              ))}
            </div>
          )}

          <div className="adm-page" key={tab.id + view.id}>
            {view.kind === "stats" && <StatsPanel onAuthFail={authFail} />}
            {view.kind === "users" && <UserList onAuthFail={authFail} />}
            {view.kind === "approval" && (
              <TokoApproval
                onCount={setPending}
                onAuthFail={authFail}
                onConfirm={askConfirm}
                onApproved={() => { loadStores(); setReload((n) => n + 1); }}
              />
            )}

            {view.sections?.map((s) =>
              s.kind === "content" ? (
                <ContentForm key={s.key} contentKey={s.key} onAuthFail={authFail} />
              ) : (
                <CrudTable
                  key={s.key}
                  listKey={s.key}
                  stores={stores}
                  reloadSignal={reload}
                  onAuthFail={authFail}
                  onConfirm={askConfirm}
                  onChanged={s.key === "stores" ? loadStores : undefined}
                />
              )
            )}
          </div>
        </main>
      </div>

      {confirm && (
        <div className="confirm-overlay open" onClick={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className="confirm-box">
            <h3>Konfirmasi</h3>
            <p>{confirm.message}</p>
            <div className="confirm-actions">
              <button type="button" className="confirm-cancel" onClick={() => setConfirm(null)}>Batal</button>
              <button type="button" className="confirm-ok"
                onClick={() => { const fn = confirm.ok; setConfirm(null); fn(); }}>
                Ya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
