"use client";

import Link from "next/link";
import type { User } from "@/lib/home";

export default function Navbar({
  logoText = "Pisang Ijo", user, onLogin, onLogout,
}: { logoText?: string; user: User | null; onLogin: () => void; onLogout: () => void }) {
  return (
    <header className="pj-header">
      <Link href="/" className="pj-logo">{logoText}</Link>
      <nav className="pj-nav">
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
            <button type="button" className="pj-login pj-login-sm" onClick={onLogout}>Logout</button>
          </div>
        ) : (
          <button type="button" className="pj-login" onClick={onLogin}>Login / Sign In</button>
        )}
      </div>
    </header>
  );
}