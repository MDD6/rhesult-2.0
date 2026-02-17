import "./globals.css";

export const metadata = {
  title: "RHesult • Versão 2.0",
  icons: [{ rel: "icon", url: "/favicon.svg" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body className="bg-white text-slate-900">{children}</body>
    </html>
  );
}
