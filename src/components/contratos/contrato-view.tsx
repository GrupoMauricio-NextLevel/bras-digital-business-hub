import { CheckCircle2 } from "lucide-react";
import type { DadosLojaPronta, Secao } from "@/lib/contratos/loja-pronta-express";
import { formatar } from "@/lib/contratos/loja-pronta-express";

const dataHora = (iso: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(iso));

/** O contrato na tela (D276): o mesmo texto congelado que vai no PDF. Servidor; sem interação. */
export function ContratoView({ c }: { c: { numero: string; titulo: string; hash: string; status: string; dados: Record<string, unknown>; conteudo: { secoes: Secao[] }; enviadoEm: string; aceitoEm: string | null; aceitoNome: string | null } }) {
  const d = c.dados as unknown as DadosLojaPronta;
  const resumo: [string, string][] = [
    ["Contratada", `${d.contratada.razao} · CNPJ ${d.contratada.cnpj}`],
    ["Contratante", `${d.cliente.nome} · ${d.cliente.documento} · ${d.cliente.email}`],
    ["Loja", d.loja.nome],
    ["Valor", `De ${formatar.brl(d.valorCheioCents)} por ${formatar.brl(d.valorCents)} (pagamento único)`],
    ["Pagamento", `Pix · ${formatar.brl(d.sinalCents)} em ${formatar.data(d.dataSinal)} · ${formatar.brl(d.restanteCents)} até ${formatar.data(d.dataRestante)}`],
    ["Entrega", `Até ${d.prazoDias} dias corridos depois do pagamento total e de todo o material`],
  ];
  return (
    <article className="ds-card overflow-hidden" aria-label={`Contrato ${c.numero}`}>
      <header className="bg-[#0b1328] px-5 py-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#27c7f2]">Contrato nº {c.numero}</p>
        <h2 className="mt-1 text-lg font-bold">{c.titulo}</h2>
        <p className="text-xs text-white/70">Enviado em {dataHora(c.enviadoEm)}</p>
      </header>
      <div className="grid gap-5 p-5">
        <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
          {resumo.map(([k, v]) => <div key={k} className="contents"><dt className="font-semibold text-muted-foreground">{k}</dt><dd className="break-words">{v}</dd></div>)}
        </dl>
        <section className="rounded-xl border-2 border-[#294cdc] bg-[#eef3ff] p-4 text-[#101a33]" aria-label="Dados para pagamento">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#294cdc]">Dados para pagamento · Pix</p>
          <p className="mt-1 text-xs">Chave Pix (CNPJ)</p>
          <p className="text-2xl font-extrabold tabular-nums">{d.contratada.chavePix}</p>
          <p className="mt-1 text-sm">Banco {d.contratada.banco} · Favorecido: {d.contratada.favorecido}</p>
          <p className="mt-2 text-sm">1ª parcela: <b>{formatar.brl(d.sinalCents)}</b> em {formatar.data(d.dataSinal)} · 2ª parcela: <b>{formatar.brl(d.restanteCents)}</b> até {formatar.data(d.dataRestante)}</p>
        </section>
        {c.conteudo.secoes.map((s) => (
          <section key={s.titulo} className="grid gap-2">
            <h3 className="text-base font-bold text-[#294cdc] dark:text-[#7d9bff]">{s.titulo}</h3>
            {s.resumo && <p className="border-l-4 border-[#294cdc] bg-muted px-3 py-2 text-sm">{s.resumo}</p>}
            {s.paragrafos?.map((p) => <p key={p} className="text-sm leading-relaxed">{p}</p>)}
            {s.itens && <ul className="grid gap-1 text-sm">{s.itens.map((i) => <li key={i} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />{i}</li>)}</ul>}
          </section>
        ))}
        <footer className="border-t pt-3 text-xs text-muted-foreground">
          {c.aceitoEm ? <p><b>Aceito</b> por {c.aceitoNome} em {dataHora(c.aceitoEm)}.</p> : <p>Aguardando o aceite do contratante.</p>}
          <p className="break-all">Impressão digital do texto: {c.hash}</p>
        </footer>
      </div>
    </article>
  );
}
