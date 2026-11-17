import { Megaphone } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { escopoDaAgencia, pode } from "@/lib/agencias/acesso";
import { PLATAFORMA_ROTULO, SITUACAO_CAMPANHA_ROTULO, mesaDeAnuncios } from "@/lib/agencias/gestao";
import { listarClientes } from "@/lib/agencias/clientes";
import { formatBRL } from "@/lib/money";
import { CAMPANHA_SITUACOES } from "@/db/schema";
import { AcoesCampanha, NovaCampanha } from "@/components/agencia/gestao-cliente";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tráfego e anúncios" };

/** Tráfego por cliente e Mesa de anúncios (D325), como a sala da campanha (D299) e a Mesa de anúncios do Master. */
export default async function Trafego() {
  const session = await requireRole("AGENCY");
  const db = await getDb();
  const { membro } = await escopoDaAgencia(db, session.actor);
  if (!pode.trafego(membro)) return <><PageHeader title="Tráfego e anúncios" /><EmptyState icon={Megaphone} title="O tráfego é do administrador, do gestor e do tráfego pago" description="Fale com o administrador da agência." /></>;
  const [{ campanhas, porCliente }, clientes] = await Promise.all([mesaDeAnuncios(db, session.actor), listarClientes(db, session.actor, { situacao: "ATIVO" })]);
  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <PageHeader eyebrow="Tráfego pago" title="Tráfego e anúncios" description="As campanhas de cada cliente num quadro só: o que está no ar, quanto foi investido e quanto custa cada resultado. Lance os números toda semana." actions={<NovaCampanha clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} />} />
      {porCliente.length ? (
        <section className="ds-card p-5 sm:p-6" aria-labelledby="tr-cli">
          <h2 id="tr-cli" className="mb-3 text-base font-semibold">Por cliente</h2>
          <ul className="divide-y divide-border text-sm">{porCliente.map((c) => <li key={c.clienteId} className="flex flex-wrap items-center justify-between gap-2 py-2"><span><b>{c.cliente}</b><span className="block text-xs text-muted-foreground">{c.noAr} campanha(s) no ar</span></span><span className="text-right text-xs text-muted-foreground"><b className="block text-sm text-foreground tabular-nums">{formatBRL(c.investidoCents)} investidos</b>{c.resultados} resultados{c.custoPorResultadoCents !== null ? ` · ${formatBRL(c.custoPorResultadoCents)} cada` : ""}</span></li>)}</ul>
        </section>
      ) : null}
      {campanhas.length ? (
        <section aria-label="Mesa de anúncios" className="max-w-full overflow-x-auto pb-2">
          <div className="grid auto-cols-[minmax(250px,1fr)] grid-flow-col gap-3">
            {CAMPANHA_SITUACOES.map((st) => { const col = campanhas.filter((k) => k.situacao === st); return (
              <div key={st} className="min-w-0 rounded-2xl bg-surface-muted/60 p-2.5">
                <h2 className="mb-2 flex items-center justify-between px-1 text-sm font-semibold"><span>{SITUACAO_CAMPANHA_ROTULO[st]}</span><span className="rounded-full bg-surface px-2 py-0.5 text-xs tabular-nums">{col.length}</span></h2>
                <div className="space-y-2">{col.map((k) => (
                  <article key={k.id} className={`ds-card !p-3.5 text-sm ${k.desatualizada ? "border-warning/60" : ""}`}>
                    <b className="block leading-snug">{k.nome}</b>
                    <span className="block text-xs text-muted-foreground">{k.cliente} · {PLATAFORMA_ROTULO[k.plataforma]}{k.objetivo ? ` · ${k.objetivo}` : ""}</span>
                    <span className="mt-1.5 block text-xs tabular-nums">{formatBRL(k.investidoCents)}{k.verbaMensalCents ? ` de ${formatBRL(k.verbaMensalCents)}/mês` : ""} · {k.resultados} {k.rotuloResultado}{k.custoPorResultadoCents !== null ? ` · ${formatBRL(k.custoPorResultadoCents)} cada` : ""}</span>
                    {k.desatualizada ? <span className="mt-1 block text-xs font-semibold text-warning">Números com mais de 7 dias</span> : null}
                    <AcoesCampanha id={k.id} situacao={k.situacao} investidoCents={k.investidoCents} resultados={k.resultados} />
                  </article>
                ))}</div>
              </div>
            ); })}
          </div>
        </section>
      ) : <EmptyState icon={Megaphone} title="Nenhuma campanha ainda" description="Cadastre a primeira campanha de um cliente: plataforma, objetivo e verba do mês." />}
    </div>
  );
}
