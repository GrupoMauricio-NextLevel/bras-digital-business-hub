import type { Metadata } from "next";
import { panelFor } from "@/components/app/role-layout";
import { requireStoreAdmin } from "@/lib/require-session";
import { redirect } from "next/navigation";
import { isBlocked } from "@/lib/domain/store-access";

export const metadata: Metadata = { title: "Editor do tema", robots: { index: false } };

/** Editor em tela cheia, fora do menu lateral do painel, com o clima (cores) do painel do lojista. */
export default async function ThemeEditorLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStoreAdmin();
  if (session.store && isBlocked(session.store)) redirect("/merchant");
  return <div data-panel={panelFor(session)} className="h-dvh overflow-hidden bg-background text-foreground">{children}</div>;
}
