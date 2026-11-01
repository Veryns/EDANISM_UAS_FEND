"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginClient() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Content Studio - Sign In";
    // kalau sudah login, langsung ke dashboard
    fetch("/admin/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.loggedIn) window.location.href = "/admin";
      })
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Sign-in failed. Please try again.");
        return;
      }
      // /admin masih route HTML, jadi pakai navigasi penuh
      window.location.href = data.redirect || "/admin";
    } catch {
      setError("Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-body">
      <div className="login-card">
        <h1>Content Studio</h1>
        <p className="sub">Sign in to manage your website</p>

        <form onSubmit={submit}>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="btn-login" disabled={loading}>
            Login
          </button>
          <p className="error">{error}</p>
        </form>
      </div>
    </div>
  );
}