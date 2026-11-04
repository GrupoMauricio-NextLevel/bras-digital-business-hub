"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Power, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { desligarKitBlackAction, ligarKitBlackAction } from "@/app/actions/campaigns";

type Estado = { noAr: boolean; fim: string; percentual: number; codigo: string } | null;
/** ISO → "AAAA-MM-DDTHH:mm" no horário de Brasília (o campo datetime-local). */
const local = (iso: string) => new Date(Date.parse(iso) - 3 * 3_600_000).toISOString().slice(0, 16);

/** Kit Black da loja (D242): o lojista liga em 1 clique; a vitrine ganha faixa com cupom e contagem e o selo nos produtos. */
export function KitBlack({ estado, sugestao, url }: { estado: Estado; sugestao: { percentual: number; fim: string; codigo: string }; url: string }) {
  const router = useRouter();
  const base = estado ?? sugestao;
  const [f, setF] = React.useState({ percentual: String(base.percentual), fim: local(base.fim), codigo: base.codigo });
  const [pending, start] = React.useTransition();
  const ligar = () => start(async () => {
    const r = await ligarKitBlackAction({ percentual: Number(f.percentual), fim: f.fim, codigo: f.codigo });
    if (r.ok) { toast.success(`Kit Black no ar: cupom ${r.data.codigo}`); router.refresh(); } else toast.error(r.error);
  });
  const desligar = () => start(async () => { const r = await desligarKitBlackAction(); if (r.ok) { toast.success("Kit Black desligado"); router.refresh(); } else toast.error(r.error); });
  return (
    <section className="mb-6 overflow-hidden rounded-3xl bg-neutral-950 text-white shadow-xl" aria-labelledby="kit-black-t">
      <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_1fr] md:p-8">
        <div>
          <p className="font-mono text-xs font-bold tracking-[0.2em] text-[#22e08a]">BLACK FRIDAY · KIT DA SUA LOJA</p>
          <h2 id="kit-black-t" className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Sua loja vestida para a Black em 1 clique</h2>
          <ul className="mt-4 space-y-1.5 text-sm text-white/80">
            <li>• Faixa preta no topo da loja com o cupom e a contagem regressiva</li>
            <li>• Cupom de desconto real, já criado em Cupons (nunca abaixo do custo)</li>
            <li>• Selo &quot;BLACK&quot; nos cartões de produto</li>
            <li>• Some sozinho na data de fim que você escolher</li>
          </ul>
          {estado?.noAr ? <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#22e08a]/15 px-3 py-1 text-sm font-semibold text-[#22e08a]"><span className="size-2 rounded-full bg-[#22e08a]" aria-hidden />No ar · cupom {estado.codigo} · {estado.percentual}% · <a href={url} target="_blank" rel="noreferrer" className="underline">ver a loja</a></p> : null}
        </div>
        <div className="grid content-start gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <label className="grid gap-1 text-sm"><span className="font-medium">Desconto (%)</span><Input type="number" min={5} max={70} value={f.percentual} onChange={(e) => setF({ ...f, percentual: e.target.value })} className="bg-white text-neutral-900" /></label>
          <label className="grid gap-1 text-sm"><span className="font-medium">Código do cupom</span><Input value={f.codigo} maxLength={24} onChange={(e) => setF({ ...f, codigo: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })} className="bg-white font-mono text-neutral-900" /></label>
          <label className="grid gap-1 text-sm"><span className="font-medium">Termina em (Brasília)</span><Input type="datetime-local" value={f.fim} onChange={(e) => setF({ ...f, fim: e.target.value })} className="bg-white text-neutral-900" /></label>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={ligar} loading={pending} className="bg-[#22e08a] text-neutral-950 hover:bg-[#3cf29e]"><Zap /> {estado?.noAr ? "Atualizar kit" : "Ligar kit Black"}</Button>
            {estado?.noAr ? <Button variant="ghost" onClick={desligar} disabled={pending} className="text-white hover:bg-white/10"><Power /> Desligar</Button> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
