import type { Metadata } from "next";
import TokoDashboardClient from "@/components/TokoDashboardClient";

export const metadata: Metadata = {
  title: { absolute: "Dashboard Toko - Pisang Ijo" },
};

export default function TokoDashboardPage() {
  return <TokoDashboardClient />;
}