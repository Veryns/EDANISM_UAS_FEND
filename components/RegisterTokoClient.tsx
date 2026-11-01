"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function RegisterTokoClient() {
  const [form, setForm] = useState({
    nama: "",
    email: "",
    password: "",
    nama_toko: "",
    alamat: "",
  });
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Daftar sebagai Toko — Pisang Ijo";
  }, []);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/user/register-toko", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ text: data.error || "Pendaftaran gagal, coba lagi.", ok: false });
        return;
      }
      setMsg({ text: data.message, ok: true });
      setForm({ nama: "", email: "", password: "", nama_toko: "", alamat: "" });
    } catch {
      setMsg({ text: "Terjadi kesalahan jaringan. Coba lagi.", ok: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="logo">Pisang Ijo</Link>
        </div>
      </header>

      <section className="auth-wrap">
        <div className="auth-card">
          <span className="eyebrow-mustard">Gabung Jadi Mitra</span>
          <h2>Daftarkan Toko Kamu</h2>
          <p className="section-sub" style={{ marginBottom: 24 }}>
            Isi data di bawah ini. Setelah dikirim, pendaftaran akan ditinjau admin sebelum toko kamu tampil di platform.
          </p>

          <form onSubmit={submit}>
            <div className="auth-field">
              <label htmlFor="nama">Nama Kamu</label>
              <input type="text" id="nama" required value={form.nama} onChange={set("nama")} />
            </div>
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" required value={form.email} onChange={set("email")} />
            </div>
            <div className="auth-field">
              <label htmlFor="password">Password (min. 8 karakter)</label>
              <input type="password" id="password" minLength={8} required value={form.password} onChange={set("password")} />
            </div>
            <div className="auth-field">
              <label htmlFor="nama_toko">Nama Toko</label>
              <input type="text" id="nama_toko" required value={form.nama_toko} onChange={set("nama_toko")} />
            </div>
            <div className="auth-field">
              <label htmlFor="alamat">Alamat Toko</label>
              <textarea id="alamat" rows={3} value={form.alamat} onChange={set("alamat")} />
            </div>

            <button type="submit" className="btn btn-mustard auth-submit" disabled={loading}>
              Kirim Pendaftaran
            </button>
            {msg && <div className={"auth-msg show " + (msg.ok ? "ok" : "err")}>{msg.text}</div>}
          </form>
        </div>
      </section>
    </>
  );
}