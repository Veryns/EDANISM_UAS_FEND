export const metadata = {
  title: "Pisang Ijo — Platform Kuliner Makassar",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}