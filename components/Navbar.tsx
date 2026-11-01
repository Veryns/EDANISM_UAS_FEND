"use client";

import Link from "next/link";
import type { User } from "@/lib/home";

export default function Navbar({
  logoText = "Pisang Ijo", user, onLogin, onLogout,
}: { logoText?: string; user: User | null; onLogin: () => void; onLogout: () => void }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="logo">{logoText}</Link>
        <nav className="main-nav">
          <Link href="/#beranda">Home</Link>
          <Link href="/#cari-toko">Cari Toko</Link>
          <Link href="/#menu">Menu</Link>
          <Link href="/#tentang">About</Link>
          <Link href="/#faq">FAQ</Link>
          {}
          {user && <Link href="/wishlist">List Aku</Link>}
          <Link href="/#kontak">Contact</Link>
        </nav>
        <div id="authArea">
          {user ? (
            <div className="user-chip">
              <span>Hai, {user.nama}</span>
              {user.role === "toko" && <a href="/toko-dashboard.html" className="btn btn-mustard">Dashboard Toko</a>}
              <button className="btn btn-outline-light" onClick={onLogout}>Logout</button>
            </div>
          ) : (
            <button className="btn btn-outline-light" onClick={onLogin}>Login / Sign In</button>
          )}
        </div>
      </div>
    </header>
  );
}