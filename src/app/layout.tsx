import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const display = localFont({ src: "./fonts/jakarta-latin.woff2", variable: "--nl-font-display", display: "optional", weight: "500 800" });
const text = localFont({ src: "./fonts/inter-latin.woff2", variable: "--nl-font-text", display: "swap", weight: "400 700" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://superdrop.com.br"),
  title: { default: "SuperDrop", template: "%s · SuperDrop" },
  description: "SuperDrop: venda sem estoque e fornecedor com operação de verdade. Plataforma da NextLevel Marketing.",
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
