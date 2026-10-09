import { Clapperboard, Lock } from "lucide-react";
import { BRAS_REQUEST_LABEL, type BrasRequestStatus } from "@/lib/domain/bras/catalogo";

/**
 * Telas do Meu Brás em HTML para a página pública, com os nomes e campos que o painel do membro tem hoje (Início, Descobertas,
 * Meus pedidos, Minha empresa; veredito, nota, tendência, concorrência, preço no Mercado Livre, margem estimada; situações do
 * pedido). Produtos e valores de demonstração, fictícios. Preços aparecem trancados, como para quem não é membro: a página
 * pública nunca mostra valor em reais (regra da marca fechada, conferida no e2e bras-portal).
 */
const NAV = ["Início", "Descobertas", "Meus pedidos", "Minha empresa"];

export const DEMO_DISCOVERY = {
  title: "Mini ventilador portátil recarregável",
  trend: "Buscas subindo",
  verdict: "Vale testar com poucas caixas",
  score: 8,
  marginMin: 41,
  marginMax: 58,
  units: 60,
};

const PEDIDOS: { n: string; produto: string; caixas: number; st: BrasRequestStatus }[] = [
  { n: "BD-0142", produto: "Garrafa térmica 500 ml", caixas: 6, st: "CONFIRMED" },
  { n: "BD-0139", produto: "Organizador de gaveta", caixas: 4, st: "PAID" },
  { n: "BD-0131", produto: "Luminária LED de mesa", caixas: 10, st: "PICKED_UP" },
  { n: "BD-0128", produto: "Mini ventilador portátil", caixas: 3, st: "NEW" },
];
const TOM: Record<BrasRequestStatus, string> = {
  NEW: "bg-[#fff1e6] text-[#8a3a00]",
  CONFIRMED: "bg-[#e7eefc] text-[#1d3b8a]",
  PAID: "bg-[#e3f5ea] text-[#17643a]",
  PICKED_UP: "bg-[#eceff4] text-[#3b4660]",
  CANCELED: "bg-[#fde8e8] text-[#9b1c1c]",
};

function Side({ ativo }: { ativo: string }) {
  return (
    <aside className="hidden w-40 shrink-0 bg-[#101b34] p-3 text-[#c9d1e3] sm:block">
      <p className="mb-4 flex items-center gap-2 font-extrabold text-white"><span className="grid size-6 place-items-center rounded-md bg-[#fb8342] text-[11px] text-[#101b34]">B</span>Meu Brás</p>
      <ul className="space-y-1">{NAV.map((n) => <li key={n} className={`rounded-md px-2 py-1.5 ${n === ativo ? "bg-white/10 font-semibold text-white" : ""}`}>{n}</li>)}</ul>
    </aside>
  );
}

/** Preço da caixa trancado (o visitante nunca vê preço). */
function PrecoTrancado({ compacto = false }: { compacto?: boolean }) {
  return (
    <span className="relative inline-flex items-center gap-2 whitespace-nowrap">
      <span className="inline-block h-3 w-12 rounded bg-[#101b34]/25 blur-[2px]" />
      {compacto ? <Lock className="size-3.5 text-[#101b34]" aria-label="só membros" /> : <span className="inline-flex items-center gap-1 rounded-full bg-[#101b34] px-2 py-0.5 text-[10px] font-semibold text-white"><Lock className="size-3" />só membros</span>}
    </span>
  );
}

/** A descoberta aberta no Meu Brás: veredito, nota, análise e a caixa. */
export function DiscoveryPanel({ side = true }: { side?: boolean }) {
  const d = DEMO_DISCOVERY;
  return (
    <div className="flex min-h-[23rem] bg-[#f6f4ef] text-[13px] text-[#101b34]" aria-hidden>
      {side ? <Side ativo="Descobertas" /> : null}
      <div className="min-w-0 flex-1 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a3a00]">Descoberta · {d.trend}</p>
        <p className="mt-1 text-lg font-extrabold leading-tight">{d.title}</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#101b34] text-lg font-extrabold text-[#fb8342]">{d.score}</span>
              <div><p className="text-[10px] font-semibold uppercase text-[#5b6680]">Veredito</p><p className="font-bold leading-snug">{d.verdict}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-[10px] text-[#5b6680]">Preço no Mercado Livre</p><p className="mt-1"><PrecoTrancado compacto /></p></div>
              <div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-[10px] text-[#5b6680]">Margem bruta estimada</p><p className="font-bold tabular-nums">{d.marginMin}% a {d.marginMax}%</p></div>
            </div>
            <ul className="space-y-1.5 rounded-xl bg-white p-3 shadow-sm">
              {[["Tendência", "Procura em alta com o calor; poucos anúncios com foto boa."], ["Concorrência", "Muitos vendedores, preço disperso: espaço para entrar bem."], ["Como anunciar", "Kit com 2 unidades e foto em uso."]].map(([t, x]) => (
                <li key={t}><b>{t}.</b> <span className="text-[#3b4660]">{x}</span></li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <p className="font-bold">Caixa fechada</p>
            <p className="text-[11px] text-[#5b6680]">{d.units} unidades por caixa</p>
            <div className="mt-3 space-y-2">
              <p className="flex items-center justify-between"><span className="text-[#5b6680]">Preço da caixa</span><PrecoTrancado /></p>
              <p className="flex items-center justify-between"><span className="text-[#5b6680]">Caixas disponíveis</span><span className="font-bold">só membros</span></p>
            </div>
            <span className="mt-4 flex h-9 items-center justify-center rounded-full bg-[#fb8342] text-[12px] font-bold text-[#101b34]">Pedir caixas</span>
            <p className="mt-2 text-center text-[10px] text-[#5b6680]">Retirada no Brás com a sua transportadora</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Meus pedidos: a situação de cada pedido, do recebido à retirada. */
export function RequestsPanel({ side = true }: { side?: boolean }) {
  return (
    <div className="flex min-h-[19rem] bg-[#f6f4ef] text-[13px] text-[#101b34]" aria-hidden>
      {side ? <Side ativo="Meus pedidos" /> : null}
      <div className="min-w-0 flex-1 p-4">
        <p className="text-lg font-extrabold">Meus pedidos</p>
        <ul className="mt-3 divide-y divide-[#e6e1d6] overflow-hidden rounded-xl bg-white shadow-sm">
          {PEDIDOS.map((p) => (
            <li key={p.n} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="min-w-0"><b className="tabular-nums">{p.n}</b> <span className="text-[#3b4660]">· {p.produto}</span><span className="block text-[11px] text-[#5b6680]">{p.caixas} caixas fechadas</span></span>
              <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${TOM[p.st]}`}>{BRAS_REQUEST_LABEL[p.st]}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-[#5b6680]">A importadora recebe só o endereço de envio. Seus dados ficam com a Brás Digital.</p>
      </div>
    </div>
  );
}

/** O pedido de caixas: quantidade, transportadora e endereço de envio. */
export function RequestForm() {
  return (
    <div className="space-y-3 bg-white p-4 pt-8 text-[13px] text-[#101b34]" aria-hidden>
      <p className="font-extrabold">Pedir caixas</p>
      <p className="text-[11px] text-[#5b6680]">{DEMO_DISCOVERY.title}</p>
      <div className="flex items-center justify-between rounded-xl border-2 border-[#101b34] p-3"><span>Caixas</span><span className="flex items-center gap-3 font-bold"><i className="grid size-6 place-items-center rounded-full bg-[#eceff4] not-italic">−</i>4<i className="grid size-6 place-items-center rounded-full bg-[#101b34] not-italic text-white">+</i></span></div>
      <div className="rounded-xl border border-[#d9dde6] p-3"><p className="text-[10px] text-[#5b6680]">Transportadora</p><p className="font-semibold">A que você já usa</p></div>
      <div className="rounded-xl border border-[#d9dde6] p-3"><p className="text-[10px] text-[#5b6680]">Envio</p><p className="font-semibold">Goiânia · GO</p></div>
      <p className="rounded-lg bg-[#e3f5ea] px-3 py-2 text-[12px] font-semibold text-[#17643a]">Pedido recebido. A equipe confirma com você.</p>
    </div>
  );
}

/** O Shorts de descoberta no celular: título, sinal em palavras e o convite para a análise. */
export function FeedPhone({ youtubeId, title, trend }: { youtubeId?: string; title?: string; trend?: string | null }) {
  return (
    <div className="relative aspect-[9/17] overflow-hidden bg-gradient-to-b from-[#24345e] to-[#0d1529]" aria-hidden>
      {youtubeId ? (
        // eslint-disable-next-line @next/next/no-img-element -- miniatura do próprio YouTube
        <img src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <div className="absolute inset-0 grid place-items-center"><Clapperboard className="size-14 text-white/25" /></div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/85" />
      <div className="absolute left-3 right-3 top-6 flex flex-wrap items-center justify-between gap-1 whitespace-nowrap text-[10px] font-semibold text-white">
        <span className="rounded-full bg-black/45 px-2.5 py-1">{trend ?? DEMO_DISCOVERY.trend}</span>
        <span className="rounded-full bg-[#fb8342] px-2.5 py-1 text-[#101b34]">Caixa fechada</span>
      </div>
      <div className="absolute bottom-3 left-3 right-3 space-y-2 text-white">
        <p className="text-[15px] font-bold leading-snug">{title ?? DEMO_DISCOVERY.title}</p>
        <p className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-[12px] font-semibold backdrop-blur"><Lock className="size-3.5" />Análise e preço · só para membros</p>
        <span className="flex h-10 items-center justify-center rounded-full bg-[#fb8342] text-[13px] font-bold text-[#101b34]">Ver análise e preço</span>
      </div>
    </div>
  );
}
