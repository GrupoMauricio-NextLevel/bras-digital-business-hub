import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { getBrand } from "@/lib/brand-server";
import { brandCssVars } from "@/lib/brand-palette";

const display = localFont({ src: "./fonts/jakarta-latin.woff2", variable: "--nl-font-display", display: "optional", weight: "500 800" });
const text = localFont({ src: "./fonts/inter-latin.woff2", variable: "--nl-font-text", display: "swap", weight: "400 700" });

/** Título, descrição e endereço-base vêm da marca do endereço acessado. */
export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? brand.baseUrl),
    title: { default: brand.name, template: `%s · ${brand.name}` },
    description: `${brand.name}: ${brand.description} Plataforma da NextLevel Marketing.`,
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f4f6f5" }, { media: "(prefers-color-scheme: dark)", color: "#09100c" }] };

/** Aplica o tema salvo antes da primeira pintura, evitando o flash. */
const THEME_SCRIPT = `try{var t=localStorage.getItem("nl-theme");if(t==="dark"||t==="light"||t==="system")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBrand();
  return (
    <html lang="pt-BR" className={`${display.variable} ${text.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /><style dangerouslySetInnerHTML={{ __html: brandCssVars(brand.code) }} /></head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
