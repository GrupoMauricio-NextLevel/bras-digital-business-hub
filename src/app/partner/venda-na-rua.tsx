"use client";
import * as React from "react";
import { diaDoPrazo } from "@/lib/finance/executivo-regras";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Banknote, CreditCard, MessageCircle, Receipt } from "lucide-react";
import { formatBRL } from "@/lib/money";
import type { PainelDoExecutivo } from "@/lib/domain/executivos";
import { registrarVendaDeRuaAction } from "@/app/actions/executivos";

type Plano = { key: string; name: string; monthlyCents: number | null; annualCents: number | null };

/**
 * Venda na rua (CX3, D273): o executivo escolhe a loja, o plano e como recebeu. A loja é liberada na hora e sai o recibo
 * pronto para o WhatsApp do lojista. Dinheiro fica "com você" até entregar à NextLevel (2 dias úteis).
 */
export function VendaNaRua({ d, planos }: { d: PainelDoExecutivo; planos: Plano[] }) {
  const router = useRouter();
  const [v, setV] = React.useState({ storeId: d.lojas[0]?.id ?? "", productKey: planos[0]?.key ?? "COMMERCE_START", cycle: "MONTHLY" as "MONTHLY" | "ANNUAL", meio: "DINHEIRO" as "DINHEIRO" | "MAQUININHA_VENDEDOR" });
  const [recibo, setRecibo] = React.useState<{ codigo: string; whatsapp: string; texto: string; valor: number } | null>(null);
  const [pending, start] = React.useTransition();
  const plano = planos.find((p) => p.key === v.productKey);
  const valor = plano ? (v.cycle === "ANNUAL" ? plano.annualCents : plano.monthlyCents) : null;
  const vender = () => start(async () => {
    const r = await registrarVendaDeRuaAction({ storeId: v.storeId, productKey: v.productKey as "COMMERCE_START", cycle: v.cycle, meio: v.meio });
    if (r.ok) { setRecibo({ codigo: r.data.codigo, whatsapp: r.data.whatsapp, texto: r.data.recibo, valor: r.data.valorCents }); toast.success("Venda registrada: loja liberada"); router.refresh(); } else toast.error(r.error);
  });
  const sel = "h-12 w-full rounded-xl border border-border bg-surface px-3 text-base";
  return (
    <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]" aria-label="Venda na rua" data-venda-na-rua>
      <article className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Receipt className="size-5 text-[var(--ds-primary)]" aria-hidden />Nova venda na rua</h2>
        {d.travado ? <p className="mt-2 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200" role="alert"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />Você tem dinheiro com prazo vencido. Entregue à NextLevel para voltar a vender em dinheiro; a maquininha continua liberada.</p> : null}
        {recibo ? (
          <div className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 dark:bg-emerald-950/30" role="status">
            <p className="font-bold text-emerald-800 dark:text-emerald-200">Venda {recibo.codigo} registrada · {formatBRL(recibo.valor)}</p>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-sm">{recibo.texto}</pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={recibo.whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-emerald-600 px-5 font-bold text-white"><MessageCircle className="size-5" aria-hidden />Enviar recibo no WhatsApp</a>
              <button type="button" className="min-h-12 rounded-full border border-border px-5 font-semibold" onClick={() => setRecibo(null)}>Nova venda</button>
            </div>
          </div>
        ) : d.lojas.length ? (
          <form className="mt-4 grid gap-3" onSubmit={(e) => { e.preventDefault(); vender(); }}>
            <label className="grid gap-1 text-sm font-medium">Loja do cliente<select className={sel} value={v.storeId} onChange={(e) => setV({ ...v, storeId: e.target.value })}>{d.lojas.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium">Plano<select className={sel} value={v.productKey} onChange={(e) => setV({ ...v, productKey: e.target.value })}>{planos.map((p) => <option key={p.key} value={p.key}>{p.name.replace(/^Commerce /, "")}</option>)}</select></label>
              <label className="grid gap-1 text-sm font-medium">Ciclo<select className={sel} value={v.cycle} onChange={(e) => setV({ ...v, cycle: e.target.value as "MONTHLY" })}><option value="MONTHLY">Mensal</option><option value="ANNUAL">Anual</option></select></label>
            </div>
            <fieldset><legend className="mb-1 text-sm font-medium">Como recebeu</legend>
              <div className="grid grid-cols-2 gap-2">
                {([["DINHEIRO", "Dinheiro", Banknote], ["MAQUININHA_VENDEDOR", "Maquininha", CreditCard]] as const).map(([k, rot, I]) => (
                  <label key={k} className={`flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 font-bold ${v.meio === k ? "border-foreground bg-surface-muted" : "border-border"} ${k === "DINHEIRO" && d.travado ? "opacity-50" : ""}`}>
                    <input type="radio" name="meio" className="sr-only" checked={v.meio === k} disabled={k === "DINHEIRO" && d.travado} onChange={() => setV({ ...v, meio: k })} /><I className="size-5" aria-hidden />{rot}
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="text-sm text-muted-foreground">Valor da tabela: <b className="text-foreground tabular-nums">{valor ? formatBRL(valor) : "—"}</b>. A loja é liberada na hora e você manda o recibo pelo WhatsApp.</p>
            <button disabled={pending || !v.storeId || (v.meio === "DINHEIRO" && d.travado)} className="min-h-14 rounded-2xl bg-foreground text-lg font-bold text-surface disabled:opacity-50">{pending ? "Registrando…" : `Recebi ${valor ? formatBRL(valor) : ""}: liberar loja`}</button>
          </form>
        ) : <p className="mt-3 text-sm text-muted-foreground">Nenhuma loja sua ainda. Peça para o lojista se cadastrar pelo seu link (botão abaixo) e a loja aparece aqui para você cobrar.</p>}
      </article>
      <article className={`rounded-2xl border p-5 ${d.travado ? "border-red-300" : "border-border"} bg-surface`}>
        <h2 className="flex items-center gap-2 text-lg font-bold"><Banknote className="size-5 text-amber-500" aria-hidden />Dinheiro com você</h2>
        <p className="mt-1 text-3xl font-bold tabular-nums">{formatBRL(d.totalComigoCents)}</p>
        <p className="text-sm text-muted-foreground">Entregue à NextLevel em até 2 dias úteis de cada venda.</p>
        {d.comigo.length ? <ul className="mt-3 grid gap-2">{d.comigo.map((r) => <li key={r.id} className={`flex flex-wrap justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${r.atrasado ? "border-red-300 bg-red-50 dark:bg-red-950/30" : "border-border"}`}><span><b>{r.loja}</b> · <span className="font-mono text-xs">{r.codigo}</span><span className="block text-xs text-muted-foreground">{r.atrasado ? "prazo vencido" : `entregar até ${diaDoPrazo(r.prazoAte)}`}</span></span><b className="tabular-nums">{formatBRL(r.valorCents)}</b></li>)}</ul> : <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">Tudo entregue. Bom trabalho!</p>}
      </article>
    </section>
  );
}
