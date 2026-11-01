import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: { absolute: "Content Studio - Administration" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=Inter:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}