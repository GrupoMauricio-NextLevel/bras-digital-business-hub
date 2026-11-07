"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyField } from "@/components/finance/fields";
import { formatBRL } from "@/lib/money";
import { salvarCampanhaAction } from "@/app/actions/bonus";

type Faixa = { pontos: number; valorCents: number };

/** Editor de uma campanha: faixas, orçamento e ligar/pausar. O servidor recusa se passar do teto de custo por loja. */
export function EditorDeCampanha({ c, refCents }: { c: { id: string; nome: string; faixas: Faixa[]; orcamentoCents: number; ativa: boolean }; refCents: number }) {
  const router = useRouter();
  const [aberto, setAberto] = React.useState(false);
  const [v, setV] = React.useState({ nome: c.nome, faixas: c.faixas, orcamentoCents: c.orcamentoCents, ativa: c.ativa });
  const [pending, start] = React.useTransition();
  const salvar = (patch: Partial<typeof v> = {}) => start(async () => {
    const r = await salvarCampanhaAction(c.id, { ...v, ...patch });
    if (r.ok) { toast.success("Campanha salva"); setAberto(false); router.refresh(); } else toast.error(r.error);
  });
  const setFaixa = (i: number, p: Partial<Faixa>) => setV({ ...v, faixas: v.faixas.map((f, j) => (j === i ? { ...f, ...p } : f)) });
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={c.ativa ? "secondary" : "primary"} loading={pending} onClick={() => salvar({ ativa: !c.ativa })}>{c.ativa ? "Pausar" : "Ativar"}</Button>
        <Button size="sm" variant="ghost" onClick={() => setAberto(!aberto)}>{aberto ? "Fechar" : "Editar faixas e orçamento"}</Button>
      </div>
      {aberto ? (
        <div className="grid gap-3 rounded-xl border border-border bg-surface-muted/40 p-3">
          <label className="grid gap-1 text-xs font-medium">Nome<Input value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })} /></label>
          <ul className="grid gap-2">
            {v.faixas.map((f, i) => (
              <li key={i} className="flex flex-wrap items-end gap-2">
                <label className="grid w-28 gap-1 text-xs font-medium">Pontos<Input inputMode="numeric" value={String(f.pontos)} onChange={(e) => setFaixa(i, { pontos: Number(e.target.value) || 0 })} /></label>
                <MoneyField label="Bônus" id={`faixa-${c.id}-${i}`} valueCents={f.valorCents} onChange={(x) => setFaixa(i, { valorCents: x })} className="w-40" />
                <span className="pb-2 text-xs text-muted-foreground">{f.pontos ? `${formatBRL(Math.round(f.valorCents / f.pontos))} por ponto · ${Math.round((f.valorCents / f.pontos / refCents) * 100)}% de uma mensalidade` : ""}</span>
                <Button size="sm" variant="ghost" aria-label="Remover faixa" onClick={() => setV({ ...v, faixas: v.faixas.filter((_, j) => j !== i) })}><Trash2 /></Button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-end gap-2">
            {v.faixas.length < 6 ? <Button size="sm" variant="secondary" onClick={() => { const u = v.faixas.at(-1); setV({ ...v, faixas: [...v.faixas, { pontos: (u?.pontos ?? 0) + 2, valorCents: (u?.valorCents ?? 0) + 2_000 }] }); }}><Plus /> Faixa</Button> : null}
            <MoneyField label="Orçamento do período" id={`orc-${c.id}`} valueCents={v.orcamentoCents} onChange={(x) => setV({ ...v, orcamentoCents: x })} className="w-48" />
            <Button size="sm" loading={pending} onClick={() => salvar()}>Salvar</Button>
          </div>
          <p className="text-xs text-muted-foreground">O sistema recusa salvar se, somando as campanhas ativas do mesmo público, o bônus de uma loja Start passar do teto (online 50%, rua 75% de uma mensalidade).</p>
        </div>
      ) : null}
    </div>
  );
}
