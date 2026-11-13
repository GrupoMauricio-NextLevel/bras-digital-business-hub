import { NIVEIS, recorrenteDoNivel } from "@/lib/finance/niveis-regras";
import Link from "next/link";
import { CalendarClock, Coins, Repeat, Store, Wallet } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { PrecisaDeVoce } from "@/components/app/precisa-de-voce";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { EmptyState } from "@/components/app/empty-state";
import { ganhoTexto, type painelParceiroEc } from "@/lib/domain/parceiros-ec";
import { CopyButton, PedirAgencia, WhatsAppShare } from "./partner-client";

type Painel = Awaited<ReturnType<typeof painelParceiroEc>>;
const TOM_SIT: Record<string, string> = { pagante: "bg-success-soft text-success", teste: "bg-info-soft text-info", aguardando: "bg-warning-soft text-warning", vencido: "bg-danger-soft text-danger" };

/**
 * Painel do parceiro da NextLevel Commerce (D220): o que ele ganha, quanto já é recorrente, o que fazer agora para
 * converter os indicados e como subir para agência parceira. Porcentagens das regras vigentes do catálogo.
 */
export function PainelParceiroEc({ d, link, convite }: { d: Painel; link: string; convite: string }) {
  const r = d.regras;
  const primeiro = d.parceiro.nome.split(" ")[0];
  return (
    <div className="space-y-6">
      <section className="ds-hero @container relative p-6 text-white sm:p-8">
        <div className="relative grid gap-6 @3xl:grid-cols-[1fr_minmax(0,22rem)] @3xl:items-end">
          <div>
            <span className="ec-tag"><i aria-hidden />{d.parceiro.tipo} NextLevel Commerce</span>
            <h1 className="mt-4 font-[family-name:var(--nl-font-display)] text-3xl font-bold tracking-tight sm:text-4xl">Olá, {primeiro}. Cada loja que você indica vira renda todo mês.</h1>
            <p className="mt-3 max-w-xl text-white/85">{d.parceiro.pessoaFisica ? "Programa de Indicações (CPF): você" : "Parceiro com CNPJ: você"} ganha <b className="text-white">{ganhoTexto(recorrenteDoNivel(r.recorrenteBps, "INICIAL", undefined, d.parceiro.pessoaFisica))} de toda mensalidade</b>, desde a primeira{r.meses >= 120 ? ", enquanto o cliente ficar" : ` por ${r.meses} meses`}. Com {NIVEIS[1]!.minimo} clientes ativos, {ganhoTexto(recorrenteDoNivel(r.recorrenteBps, "PRATA", undefined, d.parceiro.pessoaFisica))}; com {NIVEIS[2]!.minimo}, {ganhoTexto(recorrenteDoNivel(r.recorrenteBps, "OURO", undefined, d.parceiro.pessoaFisica))} na carteira toda. E é fácil de vender: taxa zero da plataforma nas vendas com o Mercado Pago e um preço que vence a concorrência.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/25">
            <p className="ec-mono text-white/80">Seu link</p>
            <code className="mt-1 block break-all font-[family-name:var(--pn-mono)] text-sm" data-testid="partner-main-link">{link}</code>
            <div className="mt-3 flex flex-wrap gap-2"><CopyButton text={link} label="Copiar link" /><WhatsAppShare text={convite} /></div>
            <Link href="/partner/links" className="mt-2 inline-block text-xs font-semibold text-white/80 underline underline-offset-2">Links por campanha e QR code</Link>
          </div>
        </div>
      </section>

      <OperationalPulse items={[
        { label: "Ganhos do mês", value: formatBRL(d.mesCents), icon: Coins, tone: d.mesCents ? "success" : "neutral", hint: "comissões lançadas" },
        { label: "Recorrente por mês", value: formatBRL(d.recorrenteMesCents), icon: Repeat, tone: d.recorrenteMesCents ? "info" : "neutral", hint: `${d.pagantes} cliente(s) pagante(s)` },
        { label: "Disponível para saque", value: formatBRL(d.saldo.availableCents), icon: Wallet, tone: "success", hint: `${formatBRL(d.saldo.pendingCents)} em garantia`, href: "/partner/finance" },
        { label: "Indicados", value: d.indicados.length, icon: Store, tone: "neutral", hint: `${d.emTeste} em teste agora` },
      ]} />

      <PrecisaDeVoce itens={d.agora} vazio="Nenhum indicado precisando de você agora. Hora de indicar mais!" descricao="Indicados perto de virar pagantes (ou de sair). Um contato seu agora vale comissão." />

      {d.parceiro.agencia ? null : (
        <section className="ds-card p-5 sm:p-6" aria-labelledby="ag-t">
          <h2 id="ag-t" className="text-base font-semibold">É agência? Peça o selo de agência parceira</h2>
          <p className="mt-1 text-sm text-muted-foreground">Agências parceiras (com CNPJ) têm benefícios exclusivos, que a nossa equipe apresenta na aprovação, e o selo de agência parceira oficial da NextLevel.</p>
          {d.parceiro.agenciaPedida ? <p className="mt-4 rounded-xl bg-info-soft px-4 py-3 text-sm text-info"><CalendarClock className="mr-1 inline size-4" aria-hidden />Pedido em análise. A equipe responde em até 2 dias úteis.</p> : <PedirAgencia />}
        </section>
      )}

      <section className="ds-card p-5 sm:p-6" aria-labelledby="ind-t">
        <h2 id="ind-t" className="text-base font-semibold">Suas indicações</h2>
        {d.indicados.length === 0 ? <EmptyState compact icon={Store} title="Nenhuma loja indicada ainda" description="Mande o seu link para quem vende no Instagram e no WhatsApp: taxa zero da plataforma e um preço que vence a concorrência abrem a conversa." /> : (
          <ul className="mt-3 divide-y divide-border">
            {d.indicados.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                <span className="min-w-0 flex-1 basis-48"><b className="block truncate">{x.nome}</b><span className="text-xs text-muted-foreground">desde {formatDate(x.criadaEm)}{x.s.plano ? ` · ${x.s.plano}` : ""}</span></span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TOM_SIT[x.s.pagamento] ?? "bg-surface-muted text-muted-foreground"}`}>{x.s.rotulo}</span>
                <span className="w-28 text-right tabular-nums">{formatBRL(x.ganhoCents)}<span className="block text-[11px] text-muted-foreground">já ganhos</span></span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
