"use client";

import { useCallback, useEffect, useState } from "react";
import { TABS, LISTS } from "@/lib/adminConfig";
import ContentForm from "@/components/admin/ContentForm";
import CrudTable from "@/components/admin/CrudTable";
import TokoApproval from "@/components/admin/TokoApproval";

type Store = { id: number; nama: string };

export default function AdminDashboardClient() {
  const [ready, setReady] = useState(false);
  const [whoami, setWhoami] = useState("");
  const [tab, setTab] = useState("hero");
  const [stores, setStores] = useState<Store[]>([]);
  const [pending, setPending] = useState(0);
  const [reload, setReload] = useState(0);
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

  useEffect(() => {
    document.title = "Content Studio - Administration";
    fetch("/admin/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.loggedIn) return authFail();
        setWhoami("Halo, " + d.username);
        setReady(true);
        loadStores();
      })
      .catch(authFail);
  }, [authFail, loadStores]);

  async function logout() {
    const res = await fetch("/admin/auth/logout", { method: "POST" });
    const d = await res.json().catch(() => ({}));
    window.location.href = d.redirect || "/admin/login";
  }

  const askConfirm = useCallback((message: string, ok: () => void) => setConfirm({ message, ok }), []);

  if (!ready) return null;

  const active = TABS.find((t) => t.id === tab)!;

  return (
    <>
      <header className="admin-header">
        <span className="admin-logo">Administration <em>Site</em></span>
        <div className="admin-user">
          <span>{whoami}</span>
          <button className="btn-logout" onClick={logout}>Sign out</button>
        </div>
      </header>

      <div className="admin-shell">
        <nav className="admin-sidebar">
          {TABS.map((t) => (
            <button key={t.id} className={"tab-btn" + (tab === t.id ? " active" : "")} onClick={() => setTab(t.id)}>
              <span className="tab-icon">{t.icon}</span> {t.label}
              {t.approval && pending > 0 && <span className="tab-count">{pending}</span>}
            </button>
          ))}
        </nav>

        <main className="admin-main">
          <div className="tab-panel active">
            <h2>{active.label}</h2>

            {active.approval && (
              <TokoApproval
                onCount={setPending}
                onAuthFail={authFail}
                onConfirm={askConfirm}
                onApproved={() => { loadStores(); setReload((n) => n + 1); }}
              />
            )}

            {active.sections?.map((s) =>
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
    </>
  );
}