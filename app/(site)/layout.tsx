import "bootstrap/dist/css/bootstrap.min.css";
import "../style.css";
import BootstrapClient from "@/components/BootstrapClient";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      {children}
      <BootstrapClient />
    </>
  );
}