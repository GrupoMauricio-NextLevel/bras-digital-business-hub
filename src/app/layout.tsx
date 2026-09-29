import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const display = localFont({ src: "./fonts/jakarta-latin.woff2", variable: "--nl-font-display", display: "swap", weight: "500 800" });
const text = localFont({ src: "./fonts/inter-latin.woff2", variable: "--nl-font-text", display: "swap", weight: "400 700" });

export const metadata: Metadata = {
  title: { default: "NextLevel Commerce Engine", template: "%s · NextLevel" },
  description: "SuperDrop — plataforma de e-commerce multi-tenant da NextLevel Marketing.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f4f6f5" }, { media: "(prefers-color-scheme: dark)", color: "#09100c" }] };

/** Aplica o tema salvo antes da primeira pintura, evitando o flash. */
const THEME_SCRIPT = `try{var t=localStorage.getItem("nl-theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${text.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
