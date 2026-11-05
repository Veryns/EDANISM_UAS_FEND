"use client";

import { useEffect } from "react";

// Mengirim 1 kali kunjungan per hari per browser. ID anonim, tanpa data pribadi.
export default function VisitTracker() {
  useEffect(() => {
    try {
      const today = new Date().toDateString();
      if (localStorage.getItem("visit_day") === today) return;
      let vid = localStorage.getItem("visitor_id");
      if (!vid) {
        vid = crypto.randomUUID();
        localStorage.setItem("visitor_id", vid);
      }
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vid }),
        keepalive: true,
      })
        .then((r) => { if (r.ok) localStorage.setItem("visit_day", today); })
        .catch(() => {});
    } catch {
      // localStorage tidak tersedia, lewati
    }
  }, []);
  return null;
}
