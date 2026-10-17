"use client";
import * as React from "react";
import { Check, Plus, X } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { diagnosticoDaSelecao, totalSelecao, type ItemVitrine } from "@/lib/solucoes/vitrine";

/**
 * "Sua seleção" (D162): o visitante marca soluções em qualquer ponto da vitrine; uma barra acompanha a rolagem com o total
 * do que tem preço fixo (compra única e mensalidade separadas) e quantos itens são sob consulta. Saídas: contratar cada
 * item pelo caminho que já existe, ou enviar a seleção ao diagnóstico (o formulário recebe as necessidades e a mensagem).
 * Guardada só na aba (`sessionStorage`, protegido): sem armazenamento, a página funciona igual, só não lembra ao recarregar.
 */
type Ctx = { itens: ItemVitrine[]; tem: (key: string) => boolean; alternar: (i: ItemVitrine) => void; remover: (key: string) => void; limpar: () => void };
const SelecaoCtx = React.createContext<Ctx | null>(null);
const CHAVE = "nl-solucoes-selecao";
export const EVENTO_DIAGNOSTICO = "nl:solucoes-diagnostico";

// Estado guardado na aba: lido por `useSyncExternalStore` (servidor e primeira pintura começam vazios, sem divergência).
let memoria = "[]";
const MUDOU = "nl:solucoes-selecao";
const ler = () => { try { return sessionStorage.getItem(CHAVE) ?? memoria; } catch { return memoria; } };
const gravar = (keys: string[]) => { memoria = JSON.stringify(keys); try { sessionStorage.setItem(CHAVE, memoria); } catch { /* sem armazenamento: fica só na memória */ } window.dispatchEvent(new Event(MUDOU)); };
const assinar = (cb: () => void) => { window.addEventListener(MUDOU, cb); return () => window.removeEventListener(MUDOU, cb); };

export function SelecaoProvider({ catalogo, children }: { catalogo: ItemVitrine[]; children: React.ReactNode }) {
  const bruto = React.useSyncExternalStore(assinar, ler, () => "[]");
  // Preço e nome sempre do catálogo de agora (a aba guarda só as chaves).
  const itens = React.useMemo(() => { try { const k = JSON.parse(bruto) as string[]; return Array.isArray(k) ? catalogo.filter((c) => k.includes(c.key)) : []; } catch { return []; } }, [bruto, catalogo]);
  const salvar = (novos: ItemVitrine[]) => gravar(novos.map((i) => i.key));
  const ctx: Ctx = {
    itens,
    tem: (k) => itens.some((i) => i.key === k),
    alternar: (i) => salvar(itens.some((x) => x.key === i.key) ? itens.filter((x) => x.key !== i.key) : [...itens, i]),
    remover: (k) => salvar(itens.filter((x) => x.key !== k)),
    limpar: () => salvar([]),
  };
  return <SelecaoCtx.Provider value={ctx}>{children}<BarraSelecao /></SelecaoCtx.Provider>;
}

export function BotaoSelecao({ item, className }: { item: ItemVitrine; className?: string }) {
  const s = React.useContext(SelecaoCtx);
  if (!s) return null;
  const on = s.tem(item.key);
  return (
    <button type="button" aria-pressed={on} onClick={() => s.alternar(item)}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${on ? "border-transparent bg-[var(--ds-primary)] text-[var(--ds-primary-contrast)]" : "border-border text-foreground hover:bg-surface-muted"} ${className ?? ""}`}>
      {on ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}{on ? "Na seleção" : "Adicionar à seleção"}<span className="sr-only">: {item.nome}</span>
    </button>
  );
}

const resumoTotal = (itens: ItemVitrine[]) => {
  const t = totalSelecao(itens);
  return [t.unicoCents ? `${formatBRL(t.unicoCents)} à vista` : null, t.mensalCents ? `${formatBRL(t.mensalCents)}/mês` : null, t.consulta ? `${t.consulta} sob consulta` : null].filter(Boolean).join(" · ");
};

function BarraSelecao() {
  const s = React.useContext(SelecaoCtx)!;
  const [abrir, setAberta] = React.useState(false);
  const aberta = abrir && s.itens.length > 0;
  const titulo = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => { if (aberta) titulo.current?.focus(); }, [aberta]);
  if (!s.itens.length) return null;
  const enviar = () => {
    window.dispatchEvent(new CustomEvent(EVENTO_DIAGNOSTICO, { detail: diagnosticoDaSelecao(s.itens) }));
    setAberta(false);
    document.getElementById("diagnostico")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-4 sm:pb-4" role="region" aria-label="Sua seleção">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-[1.25rem] border border-[var(--nlg-linha-escura)] bg-[var(--nlg-marinho)] text-[var(--nlg-gelo)] shadow-2xl">
        {aberta ? (
          <div className="max-h-[60vh] overflow-y-auto border-b border-[var(--nlg-linha-escura)] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 ref={titulo} tabIndex={-1} className="text-lg font-bold outline-none">Sua seleção</h2>
              <button type="button" onClick={s.limpar} className="min-h-11 text-sm text-[var(--nlg-texto-suave)] underline underline-offset-4">Limpar</button>
            </div>
            <ul className="mt-3 divide-y divide-[var(--nlg-linha-escura)]">
              {s.itens.map((i) => (
                <li key={i.key} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                  <div className="min-w-0 flex-1"><p className="font-semibold">{i.nome}</p><p className="text-sm text-[var(--nlg-texto-suave)]">{i.preco.linha}</p></div>
                  <a href={i.contratar.href} className="min-h-11 content-center text-sm font-semibold text-[var(--nlg-link-escuro)] underline underline-offset-4">{i.contratar.rotulo}<span className="sr-only">: {i.nome}</span></a>
                  <button type="button" onClick={() => s.remover(i.key)} aria-label={`Tirar ${i.nome} da seleção`} className="grid size-11 place-items-center rounded-full hover:bg-white/10"><X className="size-4" aria-hidden /></button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-[var(--nlg-texto-suave)]">Preço do catálogo de hoje, confirmado na contratação. Itens sob consulta recebem proposta por escrito.</p>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
          <button type="button" onClick={() => setAberta((v) => !v)} aria-expanded={aberta} className="min-h-11 flex-1 text-left">
            <span className="block text-sm font-bold">Sua seleção ({s.itens.length})</span>
            <span className="block text-sm text-[var(--nlg-texto-suave)]" aria-live="polite">{resumoTotal(s.itens)}</span>
          </button>
          <button type="button" onClick={enviar} className="inline-flex min-h-11 items-center rounded-full bg-[var(--nlg-royal)] px-5 text-sm font-semibold text-white hover:bg-[var(--nlg-acao)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nlg-luminoso)]">Enviar para o diagnóstico</button>
        </div>
      </div>
    </div>
  );
}
