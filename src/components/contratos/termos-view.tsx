import { CheckCircle2 } from "lucide-react";
import { HASH_TERMOS, SECOES_TERMOS, TITULO_TERMOS, VERSAO_TERMOS } from "@/lib/contratos/termos-plataforma";

/** Texto dos termos de uso da plataforma (D279): o mesmo no painel e na página pública /termos. */
export function TermosView({ compacto = false }: { compacto?: boolean }) {
  return (
    <article className="grid gap-4" aria-labelledby="termos-titulo">
      <header className={compacto ? "" : "rounded-xl bg-[#0b1328] px-5 py-4 text-white"}>
        <p className={`text-xs font-bold uppercase tracking-[0.16em] ${compacto ? "text-[#294cdc]" : "text-[#27c7f2]"}`}>Contrato de uso · versão de {VERSAO_TERMOS.split("-").reverse().join("/")}</p>
        <h2 id="termos-titulo" className="mt-1 text-lg font-bold">{TITULO_TERMOS}</h2>
      </header>
      {SECOES_TERMOS.map((s) => (
        <section key={s.titulo} className="grid gap-2">
          <h3 className="text-base font-bold text-[#294cdc] dark:text-[#7d9bff]">{s.titulo}</h3>
          {s.resumo && <p className="border-l-4 border-[#294cdc] bg-muted px-3 py-2 text-sm">{s.resumo}</p>}
          {s.paragrafos?.map((p) => <p key={p} className="text-sm leading-relaxed">{p}</p>)}
          {s.itens && <ul className="grid gap-1 text-sm">{s.itens.map((i) => <li key={i} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />{i}</li>)}</ul>}
        </section>
      ))}
      <p className="break-all border-t pt-3 text-xs text-muted-foreground">Impressão digital do texto (SHA-256): {HASH_TERMOS}</p>
    </article>
  );
}
