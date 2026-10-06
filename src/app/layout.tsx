import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { getBrand } from "@/lib/brand-server";
import { brandCssVars } from "@/lib/brand-palette";
import { getThemeKey } from "@/lib/theme-server";
import { THEME_PREPAINT_SCRIPT, themeCss } from "@/design-system/themes";

const display = localFont({ src: "./fonts/jakarta-latin.woff2", variable: "--nl-font-display", display: "swap", weight: "200 800" });
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


export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBrand();
  const themeKey = await getThemeKey();
  return (
    <html lang="pt-BR" data-ds-theme={themeKey} className={`${display.variable} ${text.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_PREPAINT_SCRIPT }} /><style dangerouslySetInnerHTML={{ __html: themeCss(themeKey) + brandCssVars(brand.code) }} /></head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
