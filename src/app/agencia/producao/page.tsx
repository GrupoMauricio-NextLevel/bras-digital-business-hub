import Link from "next/link";
import { AlarmClock, CheckCircle2, ChevronLeft, ChevronRight, Clapperboard, Hourglass, LayoutGrid, List, Scissors } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { vocabularioDaAgencia } from "@/lib/agencias/personalizar";
import { rotuloSituacao } from "@/lib/agencias/personalizacao";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Kpi } from "@/components/commerce/commerce-home";
import { CartaoClienteMes, EtapaChip, PecaCartao, PrazoTexto } from "@/components/agencia/producao";
import { escopoDaAgencia, pode } from "@/lib/agencias/acesso";
import { hojeEmSaoPaulo, listarClientes } from "@/lib/agencias/clientes";
import { mesAnterior, mesDe, mesRotulo, mesSeguinte, mesValido, situacaoRotulo } from "@/lib/agencias/fluxo";
import { listarPecas, pessoasDaAgencia, producaoDoMes } from "@/lib/agencias/producao";
import { PECA_ETAPAS, type PecaEtapa } from "@/db/schema";
import { NovaPeca, PlanejarMes } from "./producao-cliente";

export const dynamic = "force-dynamic";
export const metadata = { title: "Produção" };

type Busca = { mes?: string; ver?: string; cliente?: string; pessoa?: string; etapa?: string; atrasadas?: string };
const campo = "h-10 rounded-md border border-border bg-surface px-2 text-sm";

/** Produção da agência (D314, Fase 1A): o mês inteiro por etapa, em quadro ou lista, com filtros. */
export default async function Producao({ searchParams }: { searchParams: Promise<Busca> }) {
  const session = await requireRole("AGENCY");
  // Personalização (D340): nomes de etapas, tipos e departamentos da empresa.
  const { v: voc } = await vocabularioDaAgencia(await getDb(), session.actor);
  const ag = voc.segmento === "AGENCIA";
  const db = await getDb();
  const { membro } = await escopoDaAgencia(db, session.actor);
  const sp = await searchParams;
  const hoje = hojeEmSaoPaulo();
  const mes = sp.mes && mesValido(sp.mes) ? sp.mes : mesDe(hoje);
  const etapa = (PECA_ETAPAS as readonly string[]).includes(sp.etapa ?? "") ? (sp.etapa as PecaEtapa) : undefined;
  const ver = sp.ver === "lista" ? "lista" : "quadro";
  const [pecas, mesInfo, clientes, pessoas] = await Promise.all([
    listarPecas(db, session.actor, { mes, clienteId: sp.cliente || undefined, responsavelId: sp.pessoa || undefined, etapa, somenteAtrasadas: sp.atrasadas === "1" }, hoje),
    producaoDoMes(db, session.actor, mes, hoje),
    listarClientes(db, session.actor, { situacao: "ATIVO" }),
    pessoasDaAgencia(db, session.actor),
  ]);
  const t = mesInfo.total;
  const qs = (extra: Record<string, string | undefined>) => { const p = new URLSearchParams(); for (const [k, v] of Object.entries({ mes, ver, cliente: sp.cliente, pessoa: sp.pessoa, etapa, atrasadas: sp.atrasadas, ...extra })) if (v) p.set(k, v); return `/agencia/producao?${p}`; };
  const clienteFiltro = sp.cliente ? mesInfo.clientes.find((c) => c.clienteId === sp.cliente) : null;
  const planejar = pode.planejar(membro);
  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <PageHeader eyebrow={voc.nomes.producao} title={`${voc.nomes.producao} de ${mesRotulo(mes)}`} description={voc.segmento === "AGENCIA" ? "Cada conteúdo do planejamento à publicação. Ao concluir uma etapa, a peça vai sozinha para a próxima pessoa." : `Cada ${voc.nomes.entrega.toLowerCase()} do começo ao fim. Ao concluir uma etapa, ela vai sozinha para a próxima pessoa.`}
        actions={<div className="flex flex-wrap items-start gap-2">
          {planejar ? <PlanejarMes mes={mes} clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} /> : null}
          {planejar ? <NovaPeca mes={mes} clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))} clienteInicial={sp.cliente} tipos={voc.tiposAtivos.map((t) => [t, voc.tipo[t]])} entrega={voc.nomes.entrega} /> : null}
        </div>} />

      <div className="flex flex-wrap items-center gap-2">
        <Link href={qs({ mes: mesAnterior(mes) })} className="inline-flex min-h-11 items-center gap-1 rounded-md border border-border px-3 text-sm font-semibold hover:bg-surface-muted" aria-label="Mês anterior"><ChevronLeft className="size-4" aria-hidden />{mesRotulo(mesAnterior(mes)).split(" ")[0]}</Link>
        <Link href={qs({ mes: mesSeguinte(mes) })} className="inline-flex min-h-11 items-center gap-1 rounded-md border border-border px-3 text-sm font-semibold hover:bg-surface-muted" aria-label="Mês seguinte">{mesRotulo(mesSeguinte(mes)).split(" ")[0]}<ChevronRight className="size-4" aria-hidden /></Link>
        <span className="mx-1 h-6 w-px bg-border" aria-hidden />
        <Link href={qs({ ver: "quadro" })} aria-current={ver === "quadro" ? "page" : undefined} className={`inline-flex min-h-11 items-center gap-1.5 rounded-md border px-3 text-sm font-semibold ${ver === "quadro" ? "border-[var(--ds-link)] bg-[var(--ds-link)]/10" : "border-border"}`}><LayoutGrid className="size-4" aria-hidden />Quadro</Link>
        <Link href={qs({ ver: "lista" })} aria-current={ver === "lista" ? "page" : undefined} className={`inline-flex min-h-11 items-center gap-1.5 rounded-md border px-3 text-sm font-semibold ${ver === "lista" ? "border-[var(--ds-link)] bg-[var(--ds-link)]/10" : "border-border"}`}><List className="size-4" aria-hidden />Lista</Link>
      </div>

      <section aria-label="Números do mês" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <Kpi i={1} icon={Clapperboard} label="Contratados" value={String((clienteFiltro?.contagem ?? t).contratado)} note={`${(clienteFiltro?.contagem ?? t).planejadas} planejados`} />
        <Kpi i={2} icon={CheckCircle2} label={ag ? "Publicados" : voc.etapa.PUBLICADO} value={`${(clienteFiltro?.contagem ?? t).percentualPublicado}%`} note={ag ? `${(clienteFiltro?.contagem ?? t).publicadas} publicados · ${(clienteFiltro?.contagem ?? t).produzidas} produzidos` : `${(clienteFiltro?.contagem ?? t).publicadas} de ${(clienteFiltro?.contagem ?? t).contratado}`} />
        <Kpi i={3} icon={Scissors} label={ag ? "Em edição" : `Em ${voc.etapa.EDICAO.toLowerCase()}`} value={String((clienteFiltro?.contagem ?? t).emEdicao)} note={ag ? "edição e revisão interna" : "perto de ficar pronto"} />
        <Kpi i={4} icon={Hourglass} label={ag ? "Aguardando aprovação" : voc.etapa.APROVACAO} value={String((clienteFiltro?.contagem ?? t).aguardandoAprovacao)} note={ag ? "do cliente" : `com o ${voc.nomes.cliente.toLowerCase()}`} />
        <Kpi i={5} icon={AlarmClock} label="Atrasadas" value={String((clienteFiltro?.contagem ?? t).atrasadas)} note={(clienteFiltro?.contagem ?? t).herdadas ? `${(clienteFiltro?.contagem ?? t).herdadas} do mês anterior` : "pelo prazo da etapa"} />
      </section>

      <form method="get" action="/agencia/producao" className="ds-card flex flex-wrap items-end gap-3 !p-3" aria-label="Filtros">
        <input type="hidden" name="mes" value={mes} /><input type="hidden" name="ver" value={ver} />
        <label className="text-xs font-medium">Cliente<br /><select name="cliente" defaultValue={sp.cliente ?? ""} className={campo}><option value="">Todos</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
        <label className="text-xs font-medium">Pessoa<br /><select name="pessoa" defaultValue={sp.pessoa ?? ""} className={campo}><option value="">Todas</option>{pessoas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
        <label className="text-xs font-medium">Etapa<br /><select name="etapa" defaultValue={etapa ?? ""} className={campo}><option value="">Todas</option>{PECA_ETAPAS.filter((e) => voc.etapasAtivas.has(e)).map((e) => <option key={e} value={e}>{voc.etapa[e]}</option>)}</select></label>
        <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" name="atrasadas" value="1" defaultChecked={sp.atrasadas === "1"} className="size-4" />Só atrasadas</label>
        <button type="submit" className="h-10 rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)]">Filtrar</button>
        {sp.cliente || sp.pessoa || etapa || sp.atrasadas ? <Link href={`/agencia/producao?mes=${mes}&ver=${ver}`} className="inline-flex min-h-10 items-center text-sm font-semibold text-link underline underline-offset-4">Limpar</Link> : null}
      </form>

      {!sp.cliente && mesInfo.clientes.length ? (
        <section aria-labelledby="pr-cli">
          <h2 id="pr-cli" className="mb-2 text-base font-semibold">{voc.nomes.entregas} por {voc.nomes.cliente.toLowerCase()}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{mesInfo.clientes.map((c) => <CartaoClienteMes key={c.clienteId} id={c.clienteId} nome={c.clienteNome} segmento={c.segmento} c={c.contagem} nomes={voc.segmento === "AGENCIA" ? undefined : voc.etapa} />)}</div>
        </section>
      ) : null}

      {pecas.length === 0 ? (
        <EmptyState icon={Clapperboard} title={`Nenhuma ${voc.nomes.entrega.toLowerCase()} por aqui`} description={planejar ? "Use \"Planejar o mês\" para criar as peças pelo pacote de cada cliente, ou cadastre uma peça avulsa." : "Quando houver peças com você ou nos seus clientes, elas aparecem aqui."} />
      ) : ver === "quadro" ? (
        <section aria-label="Quadro por etapa" className="max-w-full overflow-x-auto pb-2">
          <div className="grid auto-cols-[minmax(232px,1fr)] grid-flow-col gap-3">
            {PECA_ETAPAS.filter((e) => (!etapa || e === etapa) && (voc.etapasAtivas.has(e) || pecas.some((p) => p.etapa === e))).map((e) => {
              const col = pecas.filter((p) => p.etapa === e);
              return (
                <div key={e} className="min-w-0 rounded-2xl bg-surface-muted/60 p-2.5">
                  <h3 className="mb-2 flex items-center justify-between px-1 text-sm font-semibold"><span>{voc.etapa[e]}</span><span className="rounded-full bg-surface px-2 py-0.5 text-xs tabular-nums">{col.length}</span></h3>
                  <div className="space-y-2">{col.map((p) => <PecaCartao key={p.id} p={p} nomes={{ etapa: voc.etapa, tipo: voc.tipo, situacao: (e, x) => rotuloSituacao(voc, e, x, situacaoRotulo) }} />)}</div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <ul className="ds-card ds-card--flush divide-y divide-border" aria-label="Peças">
          {pecas.map((p) => (
            <li key={p.id}><Link href={`/agencia/producao/${p.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-surface-muted">
              <span className="min-w-0 flex-1 basis-56"><b className="block">{p.titulo}</b><span className="text-xs text-muted-foreground">{p.clienteNome} · {voc.tipo[p.tipo]} · {rotuloSituacao(voc, p.etapa, p.situacao, situacaoRotulo)} · {p.responsavelNome ? `com ${p.responsavelNome.split(" ")[0]}` : "sem responsável"}{p.herdada ? " · mês anterior" : ""}</span></span>
              <span className="text-xs"><PrazoTexto prazo={p.prazo} atrasada={p.atrasada} /></span>
              <EtapaChip etapa={p.etapa} nomes={voc.etapa} />
            </Link></li>
          ))}
        </ul>
      )}
    </div>
  );
}
