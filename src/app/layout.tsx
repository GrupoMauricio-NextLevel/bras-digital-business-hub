import { verificacaoBuscadores } from "@/lib/seo/verificacao";
import type { Metadata, Viewport } from "next";
import { ogImageFor } from "@/lib/og-marca";
import localFont from "next/font/local";
import { Barlow_Condensed, Bebas_Neue, Inter, Montserrat, Oswald } from "next/font/google";
import "./globals.css";
import "@/theme-estadio/stadium.css";
import { Toaster } from "@/components/ui/toaster";
import { getBrand } from "@/lib/brand-server";
import { brandCssVars } from "@/lib/brand-palette";
import { getThemeKey } from "@/lib/theme-server";
import { brandIcons } from "@/components/brand/brand-logo";
import { BDC, BDC_ICONES } from "@/lib/marcas/bras-digital-club";
import { NL, NL_ICONES } from "@/lib/marcas/nextlevel";
import { EC, EC_ICONES } from "@/lib/marcas/nextlevel-ecommerce";
import { robotsForBrandPortal } from "@/lib/bras/visibility";
import { THEME_PREPAINT_SCRIPT, themeCss } from "@/design-system/themes";

const display = localFont({ src: "./fonts/jakarta-latin.woff2", variable: "--nl-font-display", display: "swap", weight: "200 800" });
const text = localFont({ src: "./fonts/inter-latin.woff2", variable: "--nl-font-text", display: "swap", weight: "400 700" });

const estadioBarlow = Barlow_Condensed({ subsets: ["latin"], variable: "--estadio-font-barlow", weight: ["400", "600", "700"], display: "swap" });
const estadioBebas = Bebas_Neue({ subsets: ["latin"], variable: "--estadio-font-bebas", weight: ["400"], display: "swap" });
const estadioOswald = Oswald({ subsets: ["latin"], variable: "--estadio-font-oswald", weight: ["400", "500", "700"], display: "swap" });
const estadioInter = Inter({ subsets: ["latin"], variable: "--estadio-font-inter", weight: ["400", "500", "600", "700"], display: "swap" });
const estadioMontserrat = Montserrat({ subsets: ["latin"], variable: "--estadio-font-montserrat", weight: ["400", "500", "600", "700"], display: "swap" });

/** Título, descrição e endereço-base vêm da marca do endereço acessado. */
export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? brand.baseUrl),
    title: { default: brand.name, template: `%s · ${brand.name}` },
    description: `${brand.name}: ${brand.description} Plataforma da NextLevel Marketing.`,
    icons: brandIcons(brand.code),
    // Brás Digital Club (D158) e NextLevel v2 (D161): manifesto com os ícones 192/512 do pacote. As outras marcas seguem sem manifesto.
    ...(brand.code === BDC.code ? { manifest: BDC_ICONES.manifest, twitter: { card: "summary_large_image", title: brand.name, description: BDC.tagline, images: [ogImageFor(brand).url] } } : {}),
    ...(brand.code === EC.code ? { manifest: EC_ICONES.manifest } : {}),
    ...(brand.code === NL.code ? { manifest: NL_ICONES.manifest, twitter: { card: "summary_large_image", title: `${NL.name} · ${NL.supportLine.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}`, description: NL.tagline, images: [ogImageFor(brand).url] } } : {}),
    // Prévia de link da própria marca (antes um arquivo único com a arte do SuperDrop valia para todos os endereços).
    openGraph: { siteName: brand.name, locale: "pt_BR", type: "website", title: brand.name, description: brand.description, images: [ogImageFor(brand)] },
    // Marca de operação fechada (Brás Digital) ainda "em breve": nenhuma página do endereço é indexável. As demais marcas não mudam.
    ...(robotsForBrandPortal(brand) ? { robots: robotsForBrandPortal(brand) } : {}),
    // Google Search Console e Bing Webmaster (D343): código colado no Render; só na Commerce.
    ...(brand.code === "NEXTLEVEL_COMMERCE" && verificacaoBuscadores() ? { verification: verificacaoBuscadores() } : {}),
  };
}

/** Cor da barra do navegador: a do grupo; a Brás Digital Club e a NextLevel v2 usam o marinho delas nos dois modos. */
export async function generateViewport(): Promise<Viewport> {
  const brand = await getBrand();
  if (brand.code === BDC.code) return { width: "device-width", initialScale: 1, themeColor: BDC.cores.navy };
  if (brand.code === NL.code) return { width: "device-width", initialScale: 1, themeColor: NL.cores.marinho };
  if (brand.code === EC.code) return { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: light)", color: EC.cores.gelo }, { media: "(prefers-color-scheme: dark)", color: EC.cores.marinho }] };
  return { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: light)", color: "#F4F1E9" }, { media: "(prefers-color-scheme: dark)", color: "#0B1427" }] };
}


export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBrand();
  const themeKey = await getThemeKey();
  return (
    <html lang="pt-BR" data-ds-theme={themeKey} className={`${display.variable} ${text.variable} ${estadioBarlow.variable} ${estadioBebas.variable} ${estadioOswald.variable} ${estadioInter.variable} ${estadioMontserrat.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_PREPAINT_SCRIPT }} /><style dangerouslySetInnerHTML={{ __html: themeCss(themeKey) + brandCssVars(brand.code) }} /></head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
