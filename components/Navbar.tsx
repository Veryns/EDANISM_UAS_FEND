"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@/lib/home";

export default function Navbar({
  logoText = "Pisang Ijo", user, onLogin, onLogout,
}: { logoText?: string; user: User | null; onLogin: () => void; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  // Esc menutup menu; kembali ke lebar desktop juga menutupnya
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onResize = () => { if (window.matchMedia("(min-width: 75.01rem)").matches) setOpen(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <header className="pj-header">
      <div className="pj-header-in">
        <Link href="/" className="pj-logo" onClick={close}>{logoText}</Link>
        <button
          type="button"
          className="pj-burger"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          aria-controls="pjMenu"
          onClick={() => setOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
        <div id="pjMenu" className={"pj-menu-panel" + (open ? " open" : "")}>
          <nav className="pj-nav" onClick={close}>
            <Link href="/#beranda">Home</Link>
            <Link href="/#cari-toko">Cari Toko</Link>
            <Link href="/#menu">Menu</Link>
            <Link href="/#tentang">About</Link>
            <Link href="/#faq">FAQ</Link>
            {user && <Link href="/wishlist">List Aku</Link>}
            <Link href="/#kontak">Contact</Link>
          </nav>
          <div id="authArea" className="pj-auth">
            {user ? (
              <div className="pj-user">
                <span>Hai, {user.nama}</span>
                {user.role === "toko" && <a href="/toko-dashboard" className="pj-login pj-login-sm">Dashboard Toko</a>}
                <button type="button" className="pj-login pj-login-sm" onClick={() => { close(); onLogout(); }}>Logout</button>
              </div>
            ) : (
              <button type="button" className="pj-login" onClick={() => { close(); onLogin(); }}>Login / Sign In</button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
