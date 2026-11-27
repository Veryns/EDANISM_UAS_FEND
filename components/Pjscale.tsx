"use client";

import { useLayoutEffect } from "react";

export default function PjScale() {
  useLayoutEffect(() => {
    const set = () =>
      document.documentElement.style.setProperty("--z", String(document.documentElement.clientWidth / 1440));
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);
  return null;
}