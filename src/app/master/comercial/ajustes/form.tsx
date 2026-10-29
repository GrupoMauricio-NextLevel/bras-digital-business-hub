"use client";
import * as React from "react";
import { toast } from "sonner";
import { salvarConfigComercialAction } from "@/app/actions/comercial";
import type { ChaveMensagem, ConfigComercial } from "@/lib/domain/comercial-config";

/** Formulário dos ajustes do Comercial (D205). */
export function FormAjustesComercial({ inicial, rotulos }: { inicial: ConfigComercial; rotulos: readonly (readonly [ChaveMensagem, string])[] }) {
  const [cfg, setCfg] = React.useState(inicial);
  const [pending, start] = React.useTransition();
  const num = (k: "metaPagantes" | "esperaAmarelaMin" | "esperaVermelhaMin") => (e: React.ChangeEvent<HTMLInputElement>) => setCfg({ ...cfg, [k]: Number(e.target.value) });
  const salvar = (e: React.FormEvent) => { e.preventDefault(); start(async () => { const r = await salvarConfigComercialAction(cfg); if (r.ok) toast.success("Ajustes salvos"); else toast.error(r.error); }); };
  const campo = "mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2";
  return (
    <form onSubmit={salvar} className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <section className="ds-card content-start text-sm" aria-labelledby="meta-t">
        <h2 id="meta-t" className="mb-3 text-lg font-bold">Meta e alertas</h2>
        <label className="block font-semibold" htmlFor="meta">Meta de lojistas pagantes</label>
        <input id="meta" type="number" min={1} value={cfg.metaPagantes} onChange={num("metaPagantes")} className={campo} />
        <label className="mt-4 block font-semibold" htmlFor="amarelo">Espera que acende o amarelo (minutos)</label>
        <input id="amarelo" type="number" min={1} value={cfg.esperaAmarelaMin} onChange={num("esperaAmarelaMin")} className={campo} />
        <label className="mt-4 block font-semibold" htmlFor="vermelho">Espera que acende o vermelho (minutos)</label>
        <input id="vermelho" type="number" min={2} value={cfg.esperaVermelhaMin} onChange={num("esperaVermelhaMin")} className={campo} />
      </section>
      <section className="ds-card text-sm" aria-labelledby="msg-t">
        <h2 id="msg-t" className="text-lg font-bold">Mensagens prontas de WhatsApp</h2>
        <p className="mb-3 text-muted-foreground">Use <code>{"{nome}"}</code>, <code>{"{loja}"}</code>, <code>{"{dias}"}</code> e <code>{"{passo}"}</code>: o sistema troca pelos dados da pessoa.</p>
        <div className="grid gap-4">
          {rotulos.map(([k, rotulo]) => (
            <div key={k}>
              <label className="block font-semibold" htmlFor={`msg-${k}`}>{rotulo}</label>
              <textarea id={`msg-${k}`} rows={3} value={cfg.mensagens[k]} onChange={(e) => setCfg({ ...cfg, mensagens: { ...cfg.mensagens, [k]: e.target.value } })} className={campo} />
            </div>
          ))}
        </div>
        <button type="submit" disabled={pending} className="ds-btn mt-5">Salvar ajustes</button>
      </section>
    </form>
  );
}
