"use client";

import { useEffect } from "react";

export default function BootstrapClient() {
  useEffect(() => {
    // @ts-expect-error bootstrap bundle tidak punya tipe
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);
  return null;
}