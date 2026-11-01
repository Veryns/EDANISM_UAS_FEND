"use client";

import { useEffect } from "react";

export default function BootstrapClient() {
  useEffect(() => {
    // @ts-expect-error bootstrap bundle tidak punya tipe
    import("bootstrap/dist/js/bootstrap.bundle.min.js").then((mod) => {
      const b = (mod as { default?: unknown }).default ?? mod;
      (window as unknown as Record<string, unknown>).bootstrap = b;
    });
  }, []);
  return null;
}