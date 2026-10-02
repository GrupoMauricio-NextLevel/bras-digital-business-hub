import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { publicTheme } from "@/lib/themes/gallery";
import { showcaseSlug } from "@/lib/themes/showcase";
import { DemoFrame } from "./demo-frame";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Demonstração de tema", robots: { index: false, follow: false } };

/** Link de demonstração compartilhável: a loja de exemplo com o tema, com troca de computador e celular. */
export default async function DemoPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const t = await publicTheme(await getDb(), key);
  if (!t || !t.demoReady) notFound();
  return <DemoFrame name={t.name} themeKey={t.key} src={`/store/${showcaseSlug(t.key)}`} pending={t.released === false} priceCents={t.priceCents} />;
}
