"use client";

import { useLayoutEffect } from "react";

/**
 * Skala desain 1440px.
 *
 * --z = (lebar jendela / 1440) * max(1, zoomBrowser)
 *  - Zoom 100% (atau lebih kecil) -> tampilan pas selebar jendela.
 *  - Zoom in -> konten benar-benar membesar (halaman bisa di-scroll ke samping).
 *
 * zoomBrowser = devicePixelRatio / DPR asli layar (saat zoom 100%).
 * DPR asli diperkirakan dari rasio outerWidth/innerWidth (Chrome/Edge) yang
 * dibulatkan ke langkah zoom standar, sehingga zoom 100% selalu dianggap
 * ukuran normal walau halaman pertama kali dibuka dalam keadaan ter-zoom.
 */
const STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];

function nativeDpr(): number {
  const dpr = window.devicePixelRatio || 1;
  const ratio = window.outerWidth && window.innerWidth ? window.outerWidth / window.innerWidth : 1;
  const est = STEPS.reduce((a, b) => (Math.abs(b - ratio) < Math.abs(a - ratio) ? b : a), 1);
  return dpr / est;
}

export default function PjScale() {
  useLayoutEffect(() => {
    const base = nativeDpr();
    const set = () => {
      const zoom = (window.devicePixelRatio || 1) / base;
      const z = (document.documentElement.clientWidth / 1440) * Math.max(1, zoom);
      document.documentElement.style.setProperty("--z", String(z));
    };
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);
  return null;
}
