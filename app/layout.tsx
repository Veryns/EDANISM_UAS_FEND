import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";
import BootstrapClient from "@/components/BootstrapClient";

export const metadata = {
  title: "Pisang Ijo — Platform Kuliner Makassar",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <BootstrapClient />
      </body>
    </html>
  );
}