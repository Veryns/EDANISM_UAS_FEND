"use client";

import { useState } from "react";
import type { User } from "@/lib/home";

type Tab = "login" | "register";

export default function AuthModal({
  initialTab, onClose, onAuthed,
}: { initialTab: Tab; onClose: () => void; onAuthed: (u: User) => void }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [err, setErr] = useState("");
  const [tokoMsg, setTokoMsg] = useState("");
  const [regType, setRegType] = useState<"user" | "toko">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [namaToko, setNamaToko] = useState("");
  const [alamat, setAlamat] = useState("");

  function switchTab(t: Tab) {
    setTab(t);
    setErr("");
    setTokoMsg("");
    setRegType("user");
  }

  async function post(url: string, body: unknown) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  }

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const { ok, data } = await post("/api/user/login", { email: email.trim(), password });
    if (!ok) return setErr(data.error || "Login gagal. Coba lagi.");
    if (data.role === "toko") {
      window.location.href = "/toko-dashboard.html";
      return;
    }
    onAuthed({ nama: data.nama, email: data.email, role: data.role });
    onClose();
  }

  async function submitRegister(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (regType === "toko") {
      const { ok, data } = await post("/api/user/register-toko", {
        nama: nama.trim(), email: email.trim(), password,
        nama_toko: namaToko.trim(), alamat: alamat.trim(),
      });
      if (!ok) return setErr(data.error || "Registrasi gagal. Coba lagi.");
      setTokoMsg(data.message);
      return;
    }
    const { ok, data } = await post("/api/user/register", { nama: nama.trim(), email: email.trim(), password });
    if (!ok) return setErr(data.error || "Registrasi gagal. Coba lagi.");
    onAuthed({ nama: data.nama, email: data.email });
    onClose();
  }

  return (
    <div className="modal-backdrop open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="modal-close" aria-label="Tutup" onClick={onClose}>&times;</button>

        <div className="modal-tabs">
          <button className={"modal-tab" + (tab === "login" ? " active" : "")} onClick={() => switchTab("login")}>Login</button>
          <button className={"modal-tab" + (tab === "register" ? " active" : "")} onClick={() => switchTab("register")}>Daftar Akun</button>
        </div>

        <p className={"modal-error" + (err ? " show" : "")}>{err}</p>

        {tab === "login" && (
          <form className="modal-form" onSubmit={submitLogin}>
            <div className="field">
              <label htmlFor="loginEmail">Email</label>
              <input type="email" id="loginEmail" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="loginPassword">Password</label>
              <input type="password" id="loginPassword" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-mustard modal-submit">Login</button>
          </form>
        )}

        {tab === "register" && tokoMsg && <p className="modal-success show">{tokoMsg}</p>}

        {tab === "register" && !tokoMsg && (
          <form className="modal-form" onSubmit={submitRegister}>
            <div className="field">
              <label>Daftar sebagai</label>
              <div className="register-type-toggle">
                <button type="button" className={"type-toggle-btn" + (regType === "user" ? " active" : "")} onClick={() => setRegType("user")}>Pengguna Biasa</button>
                <button type="button" className={"type-toggle-btn" + (regType === "toko" ? " active" : "")} onClick={() => setRegType("toko")}>Pemilik Toko</button>
              </div>
            </div>
            <div className="field">
              <label htmlFor="registerNama">Nama</label>
              <input type="text" id="registerNama" required autoComplete="name" value={nama} onChange={(e) => setNama(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="registerEmail">Email</label>
              <input type="email" id="registerEmail" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="registerPassword">Password</label>
              <input type="password" id="registerPassword" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <p className="field-hint">Minimal 8 karakter</p>
            </div>
            {regType === "toko" && (
              <div>
                <div className="field">
                  <label htmlFor="registerNamaToko">Nama Toko</label>
                  <input type="text" id="registerNamaToko" required autoComplete="organization" value={namaToko} onChange={(e) => setNamaToko(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="registerAlamatToko">Alamat Toko</label>
                  <textarea id="registerAlamatToko" rows={2} value={alamat} onChange={(e) => setAlamat(e.target.value)} />
                </div>
                <p className="field-hint">Pendaftaran toko akan ditinjau admin sebelum bisa login dan tampil ke publik.</p>
              </div>
            )}
            <button type="submit" className="btn btn-mustard modal-submit">Daftar</button>
          </form>
        )}
      </div>
    </div>
  );
}