"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Boxes, Layers, Lock, Plus, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { formatBRL } from "@/lib/money";
import type { PainelDeAtacado } from "@/lib/domain/atacado";
import { removerGradeAction, salvarGradeAction, salvarPrecoAtacadoAction, salvarRegrasDeMixAction } from "@/app/actions/atacado";
import { ProductTiers } from "./tiers-editor";

type P = PainelDeAtacado;
type Produto = P["produtos"][number];
type Grade = Produto["grades"][number];
const reais = (c: number | null | undefined) => (c ? (c / 100).toFixed(2).replace(".", ",") : "");
const cents = (v: string) => Math.round(Number(v.replace(/\./g, "").replace(",", ".")) * 100);
const NOME_MIX = { MIX_PECAS: "Peças em qualquer produto", MIX_VALOR: "Valor no carrinho", MIX_CATEGORIA: "Peças de uma coleção" } as const;
const PLANO_DO_MIX = { MIX_PECAS: "Start", MIX_VALOR: "Pro", MIX_CATEGORIA: "Scale" } as const;

function useSalvar() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string, depois?: () => void) => start(async () => { const r = await fn(); if (r.ok) { toast.success(ok); depois?.(); router.refresh(); } else toast.error(r.error ?? "Não foi possível salvar."); });
  return { pending, run };
}

/** Regras que liberam o preço de atacado no carrinho (mix), com a trava do plano (AT1, D258). */
export function RegrasDoMix({ regras, categorias, limites }: Pick<P, "regras" | "categorias" | "limites">) {
  type Linha = { kind: keyof typeof NOME_MIX; valor: string; categoryId: string };
  const inicial: Linha[] = regras.map((r) => ({ kind: r.kind, valor: r.kind === "MIX_VALOR" ? reais(r.minCents) : String(r.minPieces), categoryId: r.kind === "MIX_CATEGORIA" ? r.categoryId : "" }));
  const [linhas, setLinhas] = React.useState<Linha[]>(inicial);
  const { pending, run } = useSalvar();
  const salvar = () => run(() => salvarRegrasDeMixAction(linhas.filter((l) => l.valor).map((l) => l.kind === "MIX_VALOR" ? { kind: l.kind, minCents: cents(l.valor) } : l.kind === "MIX_CATEGORIA" ? { kind: l.kind, minPieces: Number(l.valor), categoryId: l.categoryId } : { kind: l.kind, minPieces: Number(l.valor) })), "Regras de atacado salvas");
  const set = (i: number, patch: Partial<Linha>) => setLinhas(linhas.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  return (
    <section className="ds-card mb-6 p-5" aria-labelledby="mix-t">
      <h2 id="mix-t" className="flex items-center gap-2 text-base font-semibold"><Layers className="size-4 text-[var(--ds-primary)]" aria-hidden />Como o atacado é liberado</h2>
      <p className="mt-1 text-sm text-muted-foreground">Quando o carrinho atinge uma regra, as peças que têm preço de atacado passam para esse preço. As peças das grades contam. Caiu abaixo, volta ao varejo.</p>
      <ul className="mt-4 grid gap-2">
        {linhas.map((l, i) => (
          <li key={i} className="flex flex-wrap items-end gap-2 rounded-xl border border-border p-3">
            <label className="grid gap-1 text-xs font-medium">Regra
              <Select value={l.kind} onChange={(e) => set(i, { kind: e.target.value as Linha["kind"] })} className="h-10 w-60">
                {(Object.keys(NOME_MIX) as Linha["kind"][]).map((k) => <option key={k} value={k} disabled={!limites.tiposMix.includes(k)}>{NOME_MIX[k]}{limites.tiposMix.includes(k) ? "" : ` (plano ${PLANO_DO_MIX[k]})`}</option>)}
              </Select>
            </label>
            <label className="grid gap-1 text-xs font-medium">{l.kind === "MIX_VALOR" ? "A partir de (R$)" : "A partir de (peças)"}
              <Input className="h-10 w-32" inputMode={l.kind === "MIX_VALOR" ? "decimal" : "numeric"} value={l.valor} onChange={(e) => set(i, { valor: e.target.value })} placeholder={l.kind === "MIX_VALOR" ? "300,00" : "6"} />
            </label>
            {l.kind === "MIX_CATEGORIA" ? (
              <label className="grid gap-1 text-xs font-medium">Coleção
                <Select value={l.categoryId} onChange={(e) => set(i, { categoryId: e.target.value })} className="h-10 w-48"><option value="">Escolha</option>{categorias.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
              </label>
            ) : null}
            <Button type="button" variant="ghost" aria-label="Remover regra" onClick={() => setLinhas(linhas.filter((_, j) => j !== i))}><Trash2 /></Button>
          </li>
        ))}
        {!linhas.length ? <li className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Sem regra: o atacado vale só pelas faixas de quantidade de cada produto e pelas grades. Ex.: &quot;6 peças em qualquer produto&quot; é o atacado mesclado do Brás.</li> : null}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {linhas.length < limites.regrasMix ? <Button type="button" variant="secondary" onClick={() => setLinhas([...linhas, { kind: "MIX_PECAS", valor: "", categoryId: "" }])}><Plus /> Regra</Button>
          : <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Lock className="size-3.5" aria-hidden />Plano {limites.plano}: até {limites.regrasMix} regra{limites.regrasMix === 1 ? "" : "s"}. <Link href="/merchant/finance#assinatura" className="font-semibold text-link underline">Mudar de plano</Link></span>}
        <Button type="button" loading={pending} onClick={salvar}>Salvar regras</Button>
      </div>
    </section>
  );
}

function PrecoAtacado({ p }: { p: Produto }) {
  const [v, setV] = React.useState(reais(p.wholesalePriceCents));
  const { pending, run } = useSalvar();
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="grid gap-1 text-xs font-medium">Preço de atacado por peça (R$)
        <Input className="h-10 w-36" inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} placeholder="sem atacado" />
      </label>
      <Button type="button" size="sm" loading={pending} onClick={() => run(() => salvarPrecoAtacadoAction(p.productId, v.trim() ? cents(v) : null), v.trim() ? "Preço de atacado salvo" : "Atacado removido do produto")}>Salvar</Button>
      <span className="pb-2 text-xs text-muted-foreground">Varejo {formatBRL(p.priceCents)} · não pode ser menor que {formatBRL(p.floorCents)}</span>
    </div>
  );
}

function EditorDeGrade({ p, g, limites, onClose }: { p: Produto; g?: Grade; limites: P["limites"]; onClose: () => void }) {
  const [v, setV] = React.useState({ name: g?.name ?? "Grade 12", kind: g?.kind ?? "GRADE_FECHADA", colorMode: g?.colorMode ?? "FIXA", color: g?.color ?? "", preco: reais(g?.priceCents), qtd: Object.fromEntries(p.variantes.map((x) => [x.id, String(g?.items.find((i) => i.variantId === x.id)?.quantity ?? "")])) as Record<string, string> });
  const { pending, run } = useSalvar();
  const pecas = Object.values(v.qtd).reduce((t, q) => t + (Number(q) || 0), 0);
  const salvar = () => run(() => salvarGradeAction(p.productId, { id: g?.id, name: v.name, kind: v.kind, colorMode: v.colorMode, color: v.color || undefined, priceCents: cents(v.preco || "0"), items: p.variantes.map((x) => ({ variantId: x.id, quantity: Number(v.qtd[x.id]) || 0 })) }), g ? "Grade atualizada" : "Grade criada", onClose);
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-surface-muted/40 p-3">
      <div className="flex flex-wrap gap-2">
        <label className="grid gap-1 text-xs font-medium">Nome<Input className="h-10 w-40" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></label>
        <label className="grid gap-1 text-xs font-medium">Tipo
          <Select className="h-10 w-48" value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value as typeof v.kind })}><option value="GRADE_FECHADA">Grade fechada</option><option value="PACOTE_SORTIDO" disabled={!limites.pacote}>Pacote sortido{limites.pacote ? "" : " (plano Pro)"}</option></Select>
        </label>
        <label className="grid gap-1 text-xs font-medium">Cor
          <Select className="h-10 w-48" value={v.colorMode} onChange={(e) => setV({ ...v, colorMode: e.target.value as typeof v.colorMode })}><option value="FIXA">Uma cor</option><option value="SORTIDA">Cores sortidas (a loja escolhe)</option><option value="POR_COR">O cliente escolhe a cor</option></Select>
        </label>
        {v.colorMode === "FIXA" ? <label className="grid gap-1 text-xs font-medium">Qual cor (opcional)<Input className="h-10 w-36" value={v.color} onChange={(e) => setV({ ...v, color: e.target.value })} placeholder="Ex.: Preto" /></label> : null}
      </div>
      <fieldset><legend className="mb-1 text-xs font-medium">Quantas peças de cada tamanho</legend>
        <div className="flex flex-wrap gap-2">{p.variantes.map((x) => <label key={x.id} className="grid w-16 gap-1 text-center text-xs font-semibold">{x.size}<Input className="h-10 text-center" inputMode="numeric" aria-label={`Peças do tamanho ${x.size}`} value={v.qtd[x.id] ?? ""} onChange={(e) => setV({ ...v, qtd: { ...v.qtd, [x.id]: e.target.value } })} /></label>)}</div>
      </fieldset>
      <div className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1 text-xs font-medium">Preço da grade (R$)<Input className="h-10 w-36" inputMode="decimal" value={v.preco} onChange={(e) => setV({ ...v, preco: e.target.value })} /></label>
        <span className="pb-2 text-xs text-muted-foreground">{pecas} peça{pecas === 1 ? "" : "s"}{pecas && v.preco ? ` · ${formatBRL(Math.round(cents(v.preco) / pecas))} a peça` : ""} · mínimo {formatBRL(p.floorCents * pecas)}</span>
        <Button type="button" size="sm" loading={pending} onClick={salvar}>Salvar grade</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>Cancelar</Button>
      </div>
    </div>
  );
}

function Grades({ p, limites }: { p: Produto; limites: P["limites"] }) {
  const [editando, setEditando] = React.useState<string | null>(null);
  const { run } = useSalvar();
  if (!p.propria) return <p className="text-xs text-muted-foreground">As grades deste produto vêm do fornecedor.</p>;
  const COR = { FIXA: "uma cor", SORTIDA: "cores sortidas", POR_COR: "cliente escolhe a cor" } as const;
  return (
    <div className="grid gap-2">
      {p.grades.map((g) => editando === g.id ? <EditorDeGrade key={g.id} p={p} g={g} limites={limites} onClose={() => setEditando(null)} /> : (
        <div key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm">
          <span><b>{g.name}</b> · {g.kind === "PACOTE_SORTIDO" ? "pacote sortido" : g.items.map((i) => `${i.size} ${i.quantity}`).join(" · ")} · {g.color ? g.color : COR[g.colorMode]} · {formatBRL(g.priceCents)} ({formatBRL(Math.round(g.priceCents / g.pecas))} a peça)</span>
          <span className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => setEditando(g.id)}>Editar</Button><Button size="sm" variant="ghost" aria-label={`Remover ${g.name}`} onClick={() => run(() => removerGradeAction(p.productId, g.id), "Grade removida")}><Trash2 /></Button></span>
        </div>
      ))}
      {editando === "nova" ? <EditorDeGrade p={p} limites={limites} onClose={() => setEditando(null)} />
        : p.grades.length < limites.gradesPorProduto ? <div><Button size="sm" variant="secondary" onClick={() => setEditando("nova")}><Plus /> Nova grade</Button></div>
        : <p className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Lock className="size-3.5" aria-hidden />Plano {limites.plano}: até {limites.gradesPorProduto} grade{limites.gradesPorProduto === 1 ? "" : "s"} por produto.</p>}
    </div>
  );
}

/** Um cartão por produto: preço de atacado, faixas por quantidade e grades. */
export function ProdutosDoAtacado({ produtos, limites }: Pick<P, "produtos" | "limites">) {
  const [busca, setBusca] = React.useState("");
  const lista = produtos.filter((p) => p.name.toLowerCase().includes(busca.toLowerCase()));
  return (
    <section aria-labelledby="prod-t">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div><h2 id="prod-t" className="flex items-center gap-2 text-base font-semibold"><Tag className="size-4 text-[var(--ds-primary)]" aria-hidden />Preços de atacado por produto</h2><p className="text-sm text-muted-foreground">{produtos.filter((p) => p.wholesalePriceCents).length} de {produtos.length} produtos com preço de atacado.</p></div>
        <label className="w-full max-w-xs"><span className="sr-only">Buscar produto</span><Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto" /></label>
      </div>
      <ul className="grid gap-3">
        {lista.map((p) => (
          <li key={p.productId} className="ds-card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-semibold">{p.name}</h3><span className="text-xs text-muted-foreground">{p.wholesalePriceCents ? `Atacado ${formatBRL(p.wholesalePriceCents)} · ` : ""}{p.grades.length} grade{p.grades.length === 1 ? "" : "s"} · {p.tiers.length} faixa{p.tiers.length === 1 ? "" : "s"}</span></div>
            <div className="mt-3"><PrecoAtacado p={p} /></div>
            <details className="mt-3 group">
              <summary className="cursor-pointer text-sm font-semibold text-link"><Boxes className="mr-1 inline size-4" aria-hidden />Grades e pacotes</summary>
              <div className="mt-2"><Grades p={p} limites={limites} /></div>
            </details>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-semibold text-link">Preço por quantidade do modelo (até {limites.faixas} faixas)</summary>
              <ul className="mt-2"><ProductTiers item={{ productId: p.productId, name: p.name, priceCents: p.priceCents, floorCents: p.floorCents, tiers: p.tiers }} max={limites.faixas} bare /></ul>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
