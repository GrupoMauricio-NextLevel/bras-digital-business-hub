import type { Metadata } from "next";
import { panelFor } from "@/components/app/role-layout";
import { requireStoreAdmin } from "@/lib/require-session";
import { redirect } from "next/navigation";
import { isBlocked } from "@/lib/domain/store-access";
import { SupportBar } from "@/components/support/support-bar";

export const metadata: Metadata = { title: "Editor do tema", robots: { index: false } };

/** Editor em tela cheia, fora do menu lateral do painel, com o clima (cores) do painel do lojista. */
export default async function ThemeEditorLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStoreAdmin();
  if (session.store && isBlocked(session.store)) redirect("/merchant");
  const sup = session.support;
  if (!sup) return <div data-panel={panelFor(session)} className="h-dvh overflow-hidden bg-background text-foreground">{children}</div>;
  // Em modo suporte, a faixa fica visível também no editor em tela cheia.
  return (
    <div data-panel={panelFor(session)} className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <div className="px-3 pt-2"><SupportBar clientName={session.user.name} roleLabel={session.store?.name ?? "Lojista"} operatorName={sup.operatorName} reason={sup.reason} act={sup.act} until={new Date(sup.exp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })} /></div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
