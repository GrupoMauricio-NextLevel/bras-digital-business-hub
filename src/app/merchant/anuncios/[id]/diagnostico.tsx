"use client";
import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Heart, MessageCircle, Send, Sparkles } from "lucide-react";
import { enviarDiagnosticoAction, salvarDiagnosticoAction } from "@/app/actions/anuncios";

type Produto = { id: string; nome: string; imagem: string | null };
type D = {
  objetivo?: "VENDAS" | "WHATSAPP" | "ALCANCE" | "LANCAMENTO"; lojaToda?: boolean; produtos?: string[]; genero?: "TODOS" | "MULHERES" | "HOMENS";
  idadeMin?: number; idadeMax?: number; regiao?: "BRASIL" | "ESTADOS" | "CIDADE"; estados?: string[]; cidade?: string; raioKm?: number; interesses?: string;
  verbaDiariaCents?: number; duracao?: "7" | "15" | "30" | "CONTINUA"; instagram?: string; contaAnuncios?: "SIM" | "NAO" | "NAO_SEI"; materiais?: ("FOTOS" | "VIDEOS" | "AJUDA")[];
  oferta?: string; diferencial?: string; observacoes?: string;
};

const OBJ = [
  { k: "VENDAS", t: "Vender mais na loja", d: "Levar gente com vontade de comprar direto para os produtos.", cta: "Comprar agora" },
  { k: "WHATSAPP", t: "Receber mensagens no WhatsApp", d: "Conversar com quem se interessou e fechar pelo WhatsApp.", cta: "Enviar mensagem" },
  { k: "ALCANCE", t: "Ficar conhecido na minha região", d: "Mostrar a marca para quem mora perto.", cta: "Saiba mais" },
  { k: "LANCAMENTO", t: "Divulgar um lançamento ou promoção", d: "Coleção nova, data especial, queima de estoque.", cta: "Ver oferta" },
] as const;
const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
const VERBAS = [1500, 2000, 3000, 5000, 10000];
const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const DIAS: Record<string, number | null> = { "7": 7, "15": 15, "30": 30, CONTINUA: null };

const PASSOS = [
  { k: "objetivo", fala: "Oi! Aqui é a equipe de anúncios da NextLevel. Vamos montar a sua campanha juntos, leva uns 5 minutos. Para começar: qual é o principal objetivo agora?" },
  { k: "produtos", fala: "Ótimo. O que você quer anunciar? Escolha até 10 produtos, ou a loja toda." },
  { k: "publico", fala: "Agora, quem costuma comprar de você?" },
  { k: "onde", fala: "E onde essas pessoas estão?" },
  { k: "verba", fala: "Quanto você quer investir por dia na Meta? Esse valor vai direto para a Meta, no seu cartão; a NextLevel não recebe esse dinheiro." },
  { k: "materiais", fala: "Para preparar o terreno: como estão o Instagram, a conta de anúncios e as fotos e vídeos?" },
  { k: "oferta", fala: "Quase lá. Tem alguma oferta ou diferencial que a gente precisa destacar?" },
  { k: "revisao", fala: "Confira o resumo. Ao enviar, o diagnóstico vai para a mesa da equipe, e você acompanha cada passo por aqui." },
] as const;

function Opcao({ ativo, onClick, titulo, texto, multi }: { ativo: boolean; onClick: () => void; titulo: string; texto?: string; multi?: boolean }) {
  return (
    <button type="button" role={multi ? "checkbox" : "radio"} aria-checked={ativo} onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition-colors ${ativo ? "border-[var(--ds-primary)] bg-[var(--ds-soft)] ring-2 ring-[var(--ds-primary)]/30" : "border-border bg-surface hover:border-[var(--ds-primary)]/50"}`}>
      <span className="flex items-start justify-between gap-3"><span className="font-semibold">{titulo}</span>{ativo ? <Check className="size-5 shrink-0 text-[var(--ds-primary)]" aria-hidden /> : null}</span>
      {texto ? <span className="mt-1 block text-sm text-muted-foreground">{texto}</span> : null}
    </button>
  );
}

/** Prévia do anúncio montada com as respostas (só ilustração; o anúncio de verdade a equipe monta na Meta). */
function Previa({ d, loja, produtos }: { d: D; loja: string; produtos: Produto[] }) {
  const obj = OBJ.find((o) => o.k === d.objetivo);
  const escolhidos = produtos.filter((p) => d.produtos?.includes(p.id));
  const img = (d.lojaToda ? produtos : escolhidos).find((p) => p.imagem)?.imagem ?? null;
  const texto = d.oferta || d.diferencial || (obj ? `${obj.t}: conheça a ${loja}.` : `Conheça a ${loja}.`);
  const publico = [d.genero === "MULHERES" ? "Mulheres" : d.genero === "HOMENS" ? "Homens" : d.genero ? "Todos" : null, d.idadeMin && d.idadeMax ? `${d.idadeMin} a ${d.idadeMax} anos` : null, d.regiao === "BRASIL" ? "Brasil" : d.regiao === "ESTADOS" ? (d.estados ?? []).join(", ") : d.regiao === "CIDADE" ? d.cidade : null].filter(Boolean).join(" · ");
  return (
    <figure aria-label="Prévia do anúncio" className="mx-auto w-full max-w-[19rem]">
      <div className="overflow-hidden rounded-[2rem] border-8 border-[#111] bg-white text-[#111] shadow-[var(--ds-shadow-md)]">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#515bd4] text-sm font-bold text-white" aria-hidden>{loja.charAt(0).toUpperCase()}</span>
          <span className="min-w-0 leading-tight"><b className="block truncate text-[13px]">{d.instagram ? d.instagram.replace(/^@+/, "") : loja}</b><span className="text-[11px] text-[#666]">Patrocinado</span></span>
        </div>
        <div className="grid aspect-square place-items-center bg-[#f3f3f3]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {img ? <img src={img} alt="" className="size-full object-cover" /> : <span className="px-6 text-center text-xs text-[#888]">A foto do produto aparece aqui quando você escolher o que anunciar</span>}
        </div>
        <div className="flex items-center justify-between bg-[#efefef] px-3 py-2 text-[13px] font-semibold"><span>{obj?.cta ?? "Saiba mais"}</span><ArrowRight className="size-4" aria-hidden /></div>
        <div className="flex gap-3 px-3 pt-2" aria-hidden><Heart className="size-5" /><MessageCircle className="size-5" /><Send className="size-5" /></div>
        <p className="px-3 pb-3 pt-1 text-[12px] leading-snug"><b>{d.instagram ? d.instagram.replace(/^@+/, "") : loja}</b> {texto}</p>
      </div>
      <figcaption className="mt-3 space-y-1 text-center text-xs text-muted-foreground">
        <span className="block">Prévia ilustrativa: a equipe cria os anúncios de verdade.</span>
        {publico ? <span className="block">Quem vai ver: {publico}</span> : null}
        {d.verbaDiariaCents ? <span className="block">Verba: {brl(d.verbaDiariaCents)} por dia{DIAS[d.duracao ?? ""] ? ` por ${DIAS[d.duracao!]} dias` : ""}</span> : null}
      </figcaption>
    </figure>
  );
}

/**
 * Diagnóstico da campanha (D299): conversa com a equipe, uma pergunta por vez, salvando sozinho; a prévia do anúncio
 * se monta ao lado com as respostas.
 */
export function Diagnostico({ id, inicial, loja, produtos }: { id: string; inicial: D; loja: string; produtos: Produto[] }) {
  const router = useRouter();
  const [d, setD] = React.useState<D>({ genero: "TODOS", idadeMin: 18, idadeMax: 55, regiao: "BRASIL", raioKm: 10, duracao: "30", lojaToda: produtos.length === 0, ...inicial });
  const [passo, setPasso] = React.useState(0);
  const [salvo, setSalvo] = React.useState<"" | "salvando" | "salvo">("");
  const [enviando, start] = React.useTransition();
  const titulo = React.useRef<HTMLHeadingElement>(null);
  const timer = React.useRef<number | undefined>(undefined);

  const atual = React.useRef(d);
  // Salva sozinho 0,7 s depois da última resposta (rascunho), sem botão.
  const mudar = (p: Partial<D>) => {
    const n = { ...atual.current, ...p };
    atual.current = n;
    setD(n);
    window.clearTimeout(timer.current);
    setSalvo("salvando");
    timer.current = window.setTimeout(async () => { const r = await salvarDiagnosticoAction(id, n); setSalvo(r.ok ? "salvo" : ""); if (!r.ok) toast.error(r.error); }, 700);
  };
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const ir = (n: number) => { setPasso(n); requestAnimationFrame(() => titulo.current?.focus()); };

  const pode = (() => {
    switch (PASSOS[passo]!.k) {
      case "objetivo": return !!d.objetivo;
      case "produtos": return !!d.lojaToda || !!d.produtos?.length;
      case "publico": return !!d.genero && (d.idadeMin ?? 18) <= (d.idadeMax ?? 65);
      case "onde": return d.regiao === "BRASIL" || (d.regiao === "ESTADOS" && !!d.estados?.length) || (d.regiao === "CIDADE" && !!d.cidade?.trim());
      case "verba": return (d.verbaDiariaCents ?? 0) >= 1000 && !!d.duracao;
      case "materiais": return !!d.contaAnuncios;
      default: return true;
    }
  })();
  const total = d.verbaDiariaCents && DIAS[d.duracao ?? ""] ? d.verbaDiariaCents * DIAS[d.duracao!]! : null;
  const enviar = () => start(async () => {
    window.clearTimeout(timer.current);
    const s = await salvarDiagnosticoAction(id, atual.current);
    if (!s.ok) { toast.error(s.error); return; }
    const r = await enviarDiagnosticoAction(id);
    if (!r.ok) { toast.error(r.error); return; }
    toast.success("Diagnóstico enviado para a equipe!");
    router.refresh();
  });
  const k = PASSOS[passo]!.k;
  const campo = "mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="ds-card min-w-0" aria-labelledby="diag-pergunta">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>Passo {passo + 1} de {PASSOS.length}</span>
          <span aria-live="polite">{salvo === "salvando" ? "Salvando…" : salvo === "salvo" ? "Salvo" : ""}</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-surface-muted" aria-hidden><div className="h-1.5 rounded-full bg-[color:var(--ds-primary)] transition-[width] motion-reduce:transition-none" style={{ width: `${((passo + 1) / PASSOS.length) * 100}%` }} /></div>
        <div className="mt-5 flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[color:var(--ds-primary)] text-white" aria-hidden><Sparkles className="size-5" /></span>
          <div className="min-w-0 rounded-2xl rounded-tl-sm bg-surface-muted px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground">Equipe de anúncios NextLevel</p>
            <h2 id="diag-pergunta" ref={titulo} tabIndex={-1} className="mt-0.5 text-base font-semibold outline-none">{PASSOS[passo]!.fala}</h2>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {k === "objetivo" ? <div role="radiogroup" aria-labelledby="diag-pergunta" className="grid gap-3 sm:grid-cols-2">{OBJ.map((o) => <Opcao key={o.k} ativo={d.objetivo === o.k} onClick={() => mudar({ objetivo: o.k })} titulo={o.t} texto={o.d} />)}</div> : null}

          {k === "produtos" ? (
            <>
              <Opcao multi ativo={!!d.lojaToda} onClick={() => mudar({ lojaToda: !d.lojaToda })} titulo="A loja toda" texto="A equipe escolhe os produtos com mais chance no anúncio." />
              {!d.lojaToda && produtos.length ? (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Produtos da loja">
                  {produtos.map((p) => {
                    const sel = !!d.produtos?.includes(p.id);
                    return (
                      <li key={p.id}>
                        <button type="button" role="checkbox" aria-checked={sel} aria-label={p.nome} disabled={!sel && (d.produtos?.length ?? 0) >= 10}
                          onClick={() => mudar({ produtos: sel ? (d.produtos ?? []).filter((x) => x !== p.id) : [...(d.produtos ?? []), p.id] })}
                          className={`relative w-full overflow-hidden rounded-xl border text-left disabled:opacity-50 ${sel ? "border-[var(--ds-primary)] ring-2 ring-[var(--ds-primary)]/30" : "border-border"}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {p.imagem ? <img src={p.imagem} alt="" className="aspect-square w-full object-cover" /> : <span className="grid aspect-square place-items-center bg-surface-muted text-xs text-muted-foreground">sem foto</span>}
                          <span className="block truncate px-2 py-1.5 text-xs font-medium">{p.nome}</span>
                          {sel ? <Check className="absolute right-2 top-2 size-6 rounded-full bg-[color:var(--ds-primary)] p-1 text-white" aria-hidden /> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              {!d.lojaToda && !produtos.length ? <p className="text-sm text-muted-foreground">Sua loja ainda não tem produtos. Marque &ldquo;a loja toda&rdquo; ou cadastre os produtos antes.</p> : null}
              {!d.lojaToda && d.produtos?.length ? <p className="text-sm text-muted-foreground">{d.produtos.length} de 10 escolhidos.</p> : null}
            </>
          ) : null}

          {k === "publico" ? (
            <>
              <div role="radiogroup" aria-label="Quem compra" className="grid gap-3 sm:grid-cols-3">
                {([["TODOS", "Todos"], ["MULHERES", "Principalmente mulheres"], ["HOMENS", "Principalmente homens"]] as const).map(([v, t]) => <Opcao key={v} ativo={d.genero === v} onClick={() => mudar({ genero: v })} titulo={t} />)}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-semibold" htmlFor="idmin">Idade a partir de</label><select id="idmin" className={campo} value={d.idadeMin} onChange={(e) => mudar({ idadeMin: Number(e.target.value) })}>{Array.from({ length: 48 }, (_, i) => 18 + i).map((n) => <option key={n} value={n}>{n} anos</option>)}</select></div>
                <div><label className="block text-sm font-semibold" htmlFor="idmax">Até</label><select id="idmax" className={campo} value={d.idadeMax} onChange={(e) => mudar({ idadeMax: Number(e.target.value) })}>{Array.from({ length: 48 }, (_, i) => 18 + i).map((n) => <option key={n} value={n}>{n === 65 ? "65 ou mais" : `${n} anos`}</option>)}</select></div>
              </div>
              <div><label className="block text-sm font-semibold" htmlFor="interesses">Gostos e interesses de quem compra (opcional)</label><input id="interesses" className={campo} value={d.interesses ?? ""} onChange={(e) => mudar({ interesses: e.target.value })} placeholder="Ex.: moda, academia, maternidade, futebol" /></div>
            </>
          ) : null}

          {k === "onde" ? (
            <>
              <div role="radiogroup" aria-label="Onde" className="grid gap-3 sm:grid-cols-3">
                {([["BRASIL", "Brasil todo", "Você envia para todo o país."], ["ESTADOS", "Alguns estados", "Escolha os estados."], ["CIDADE", "Perto de mim", "Uma cidade e um raio."]] as const).map(([v, t, x]) => <Opcao key={v} ativo={d.regiao === v} onClick={() => mudar({ regiao: v })} titulo={t} texto={x} />)}
              </div>
              {d.regiao === "ESTADOS" ? (
                <fieldset><legend className="text-sm font-semibold">Estados</legend>
                  <div className="mt-2 flex flex-wrap gap-2">{UFS.map((u) => { const on = !!d.estados?.includes(u); return <button key={u} type="button" role="checkbox" aria-checked={on} onClick={() => mudar({ estados: on ? (d.estados ?? []).filter((x) => x !== u) : [...(d.estados ?? []), u] })} className={`min-h-10 min-w-12 rounded-full border px-3 text-sm ${on ? "border-[var(--ds-primary)] bg-[var(--ds-soft)] font-semibold" : "border-border"}`}>{u}</button>; })}</div>
                </fieldset>
              ) : null}
              {d.regiao === "CIDADE" ? (
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
                  <div><label className="block text-sm font-semibold" htmlFor="cidade">Cidade</label><input id="cidade" className={campo} value={d.cidade ?? ""} onChange={(e) => mudar({ cidade: e.target.value })} placeholder="Ex.: Campinas, SP" /></div>
                  <div><label className="block text-sm font-semibold" htmlFor="raio">Raio</label><select id="raio" className={campo} value={d.raioKm} onChange={(e) => mudar({ raioKm: Number(e.target.value) })}>{[3, 5, 10, 20, 40, 80].map((r) => <option key={r} value={r}>{r} km</option>)}</select></div>
                </div>
              ) : null}
            </>
          ) : null}

          {k === "verba" ? (
            <>
              <div role="radiogroup" aria-label="Verba por dia" className="flex flex-wrap gap-2">
                {VERBAS.map((v) => <button key={v} type="button" role="radio" aria-checked={d.verbaDiariaCents === v} onClick={() => mudar({ verbaDiariaCents: v })} className={`min-h-11 rounded-full border px-4 font-semibold ${d.verbaDiariaCents === v ? "border-[var(--ds-primary)] bg-[var(--ds-soft)]" : "border-border"}`}>{brl(v)}/dia</button>)}
              </div>
              <div className="max-w-xs"><label className="block text-sm font-semibold" htmlFor="verba-outra">Outro valor por dia (R$)</label><input id="verba-outra" inputMode="numeric" className={campo} value={d.verbaDiariaCents && !VERBAS.includes(d.verbaDiariaCents) ? String(d.verbaDiariaCents / 100) : ""} onChange={(e) => { const n = Math.round(Number(e.target.value.replace(",", ".")) * 100); mudar({ verbaDiariaCents: Number.isFinite(n) ? n : undefined }); }} placeholder="Mínimo R$ 10" /></div>
              <div role="radiogroup" aria-label="Por quanto tempo" className="grid gap-3 sm:grid-cols-4">
                {([["7", "7 dias"], ["15", "15 dias"], ["30", "30 dias"], ["CONTINUA", "Sem data para acabar"]] as const).map(([v, t]) => <Opcao key={v} ativo={d.duracao === v} onClick={() => mudar({ duracao: v })} titulo={t} />)}
              </div>
              {d.verbaDiariaCents ? <p className="rounded-xl bg-surface-muted px-4 py-3 text-sm">{total ? <>Cerca de <b>{brl(total)}</b> no período, pagos direto à Meta.</> : <>{brl(d.verbaDiariaCents * 30)} por mês, pagos direto à Meta, até você pedir para parar.</>} A taxa de gestão da NextLevel vem na proposta, à parte. Resultado de anúncio não é garantido: depende do produto, do preço e da concorrência.</p> : null}
            </>
          ) : null}

          {k === "materiais" ? (
            <>
              <div><label className="block text-sm font-semibold" htmlFor="insta">Instagram da loja (opcional)</label><input id="insta" className={campo} value={d.instagram ?? ""} onChange={(e) => mudar({ instagram: e.target.value })} placeholder="@sualoja" /></div>
              <p className="text-sm font-semibold" id="conta-t">Você tem conta de anúncios na Meta?</p>
              <div role="radiogroup" aria-labelledby="conta-t" className="grid gap-3 sm:grid-cols-3">
                {([["SIM", "Sim, já anunciei"], ["NAO", "Ainda não"], ["NAO_SEI", "Não sei"]] as const).map(([v, t]) => <Opcao key={v} ativo={d.contaAnuncios === v} onClick={() => mudar({ contaAnuncios: v })} titulo={t} />)}
              </div>
              <p className="text-sm font-semibold" id="mat-t">Fotos e vídeos</p>
              <div aria-labelledby="mat-t" className="grid gap-3 sm:grid-cols-3">
                {([["FOTOS", "Tenho boas fotos"], ["VIDEOS", "Tenho vídeos"], ["AJUDA", "Preciso de ajuda"]] as const).map(([v, t]) => { const on = !!d.materiais?.includes(v); return <Opcao key={v} multi ativo={on} onClick={() => mudar({ materiais: on ? (d.materiais ?? []).filter((x) => x !== v) : [...(d.materiais ?? []), v] })} titulo={t} />; })}
              </div>
            </>
          ) : null}

          {k === "oferta" ? (
            <>
              <div><label className="block text-sm font-semibold" htmlFor="oferta">Oferta para o anúncio (opcional)</label><input id="oferta" className={campo} value={d.oferta ?? ""} onChange={(e) => mudar({ oferta: e.target.value })} placeholder="Ex.: frete grátis acima de R$ 199, 10% na primeira compra" /></div>
              <div><label className="block text-sm font-semibold" htmlFor="dif">O que a sua loja tem de diferente (opcional)</label><input id="dif" className={campo} value={d.diferencial ?? ""} onChange={(e) => mudar({ diferencial: e.target.value })} placeholder="Ex.: peças feitas à mão, entrega no mesmo dia" /></div>
              <div><label className="block text-sm font-semibold" htmlFor="obs">Algo mais que a equipe precisa saber? (opcional)</label><textarea id="obs" rows={3} className={campo} value={d.observacoes ?? ""} onChange={(e) => mudar({ observacoes: e.target.value })} /></div>
            </>
          ) : null}

          {k === "revisao" ? (
            <dl className="divide-y divide-border rounded-2xl border border-border text-sm">
              {([
                ["Objetivo", OBJ.find((o) => o.k === d.objetivo)?.t, 0],
                ["Anunciar", d.lojaToda ? "A loja toda" : produtos.filter((p) => d.produtos?.includes(p.id)).map((p) => p.nome).join(", "), 1],
                ["Público", `${d.genero === "MULHERES" ? "Mulheres" : d.genero === "HOMENS" ? "Homens" : "Todos"}, ${d.idadeMin} a ${d.idadeMax} anos${d.interesses ? ` · ${d.interesses}` : ""}`, 2],
                ["Onde", d.regiao === "BRASIL" ? "Brasil todo" : d.regiao === "ESTADOS" ? (d.estados ?? []).join(", ") : `${d.cidade} (${d.raioKm} km)`, 3],
                ["Verba", d.verbaDiariaCents ? `${brl(d.verbaDiariaCents)} por dia${DIAS[d.duracao ?? ""] ? ` por ${DIAS[d.duracao!]} dias` : ", contínua"}` : "", 4],
                ["Conta e materiais", `${d.contaAnuncios === "SIM" ? "Tem conta de anúncios" : d.contaAnuncios === "NAO" ? "Ainda sem conta de anúncios" : "Não sabe da conta"}${d.instagram ? ` · @${d.instagram.replace(/^@+/, "")}` : ""}`, 5],
                ["Oferta", d.oferta || d.diferencial || "—", 6],
              ] as const).map(([t, v, i]) => (
                <div key={t} className="px-4 py-3"><dt className="text-muted-foreground">{t}</dt><dd className="flex items-start justify-between gap-3"><span className="min-w-0 break-words font-medium">{v || "—"}</span><button type="button" className="shrink-0 text-sm font-semibold text-link underline" onClick={() => ir(i)} aria-label={`Mudar: ${t}`}>Mudar</button></dd></div>
              ))}
            </dl>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => ir(Math.max(0, passo - 1))} disabled={passo === 0} className="ds-btn ds-btn--ghost gap-1 disabled:invisible"><ArrowLeft className="size-4" aria-hidden />Voltar</button>
          {k === "revisao"
            ? <button type="button" onClick={enviar} disabled={enviando} className="ds-btn gap-1">{enviando ? "Enviando…" : "Enviar para a equipe"}<Send className="size-4" aria-hidden /></button>
            : <button type="button" onClick={() => ir(passo + 1)} disabled={!pode} className="ds-btn gap-1">Continuar<ArrowRight className="size-4" aria-hidden /></button>}
        </div>
      </section>
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <details className="lg:hidden" open={false}><summary className="ds-btn ds-btn--ghost w-full justify-center">Ver a prévia do anúncio</summary><div className="mt-3"><Previa d={d} loja={loja} produtos={produtos} /></div></details>
        <div className="hidden lg:block"><Previa d={d} loja={loja} produtos={produtos} /></div>
      </aside>
    </div>
  );
}
