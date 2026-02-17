import "../styles/globals.css";
import { AppProvider } from "@/shared/context/AppContext";
import { Montserrat, Raleway } from "next/font/google";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "RHesult • Versão 2.0",
  icons: [{ rel: "icon", url: "/Rhesult.png" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br" data-scroll-behavior="smooth" className={`${montserrat.variable} ${raleway.variable}`}>
      <body className="font-raleway bg-white text-slate-900">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
