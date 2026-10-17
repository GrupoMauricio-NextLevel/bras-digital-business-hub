import { requireRole } from "@/lib/require-session";
import { RoleLayout } from "@/components/app/role-layout";
import { AreaTheme } from "@/design-system/components/area-theme";
import { getDb } from "@/db/client";
import { BRAS_STAFF_LABEL, myImporter } from "@/lib/domain/bras/importadora";
import { SUPPLIER_PENDING_MESSAGE } from "@/lib/domain/bras/fornecedores";
import "@/components/portal/bras/bras.css";

/** Painel da importadora parceira (D110): login próprio, cor da Brás, só a própria importadora. */
export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("BRAS_IMPORTER");
  const me = await myImporter(await getDb(), session.actor).catch((e: Error) => ({ error: e.message }));
  const banner = "error" in me
    ? <div role="alert" className="border-b border-danger/40 bg-danger-soft px-4 py-2.5 text-sm text-danger">{me.error}</div>
    : <div className="border-b border-border bg-surface px-4 py-2 text-sm"><b>{me.importer.name}</b> <span className="text-muted-foreground">· {BRAS_STAFF_LABEL[me.staffRole]} · importadora parceira do Brás Digital Club</span></div>;
  // Rede aberta (D160): cadastro em análise mostra o próximo passo, não um erro.
  const emAnalise = "error" in me && me.error === SUPPLIER_PENDING_MESSAGE;
  const aguardando = emAnalise ? (
    <section className="mx-auto max-w-2xl px-4 py-10" aria-labelledby="analise-t">
      <div className="ds-card p-6">
        <p className="text-sm font-bold uppercase tracking-widest text-[var(--bd-acao)]">Cadastro recebido</p>
        <h1 id="analise-t" className="mt-2 text-2xl font-bold">Sua empresa está em análise</h1>
        <p className="mt-3 text-muted-foreground">A equipe do Brás Digital Club confere o CNPJ e os dados da empresa. Assim que for aprovado, este painel abre com produtos, estoque e as solicitações de compradores, e a sua empresa passa a aparecer no diretório para os membros.</p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground"><li>A resposta chega pelo WhatsApp ou e-mail do cadastro.</li><li>Enquanto isso, separe a lista de produtos com unidades por caixa e preço por caixa: ela entra por planilha depois da aprovação.</li></ul>
      </div>
    </section>
  ) : null;
  return <><AreaTheme theme="bras" brand="BRAS_DIGITAL" /><RoleLayout session={session} banner={emAnalise ? undefined : banner}><div className="bd-home">{"error" in me ? aguardando : children}</div></RoleLayout></>;
}
