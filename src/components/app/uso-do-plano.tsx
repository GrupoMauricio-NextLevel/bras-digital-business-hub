import Link from "next/link";
import { getDb } from "@/db/client";
import { usoDoPlano } from "@/lib/domain/beneficios-plano";

/**
 * Barra de uso do plano (D247): produtos ou pessoas, com aviso aos 80% e o caminho para mudar de plano.
 * Só na E-commerce (quem chama decide). Sem limite = mostra só o número.
 */
export async function UsoDoPlano({ storeId, recurso }: { storeId: string; recurso: "produtos" | "pessoas" }) {
  const u = await usoDoPlano(await getDb(), storeId);
  const usados = recurso === "produtos" ? u.produtos.usados : u.pessoas.usadas;
  const limite = recurso === "produtos" ? u.produtos.limite : u.pessoas.limite;
  const nome = recurso === "produtos" ? "produtos" : "pessoas no painel";
  const pct = limite ? Math.min(100, Math.round((usados / limite) * 100)) : 0;
  const cheio = limite !== null && usados >= limite;
  const alerta = limite !== null && pct >= 80;
  return (
    <div className="mb-4 rounded-2xl border border-border bg-surface p-4 text-sm" data-uso-plano={recurso}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>Plano <b>{u.nome}</b>: {limite === null ? <><b className="tabular-nums">{usados.toLocaleString("pt-BR")}</b> {nome} · sem limite</> : <><b className="tabular-nums">{usados.toLocaleString("pt-BR")} de {limite.toLocaleString("pt-BR")}</b> {nome}</>}</span>
        {alerta ? <Link href="/merchant/finance#assinatura" className="font-semibold text-link underline">Mudar de plano</Link> : null}
      </div>
      {limite !== null ? (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-valuemin={0} aria-valuemax={limite} aria-valuenow={usados} aria-label={`Uso de ${nome}`}>
          <span className={`block h-full rounded-full ${cheio ? "bg-danger" : alerta ? "bg-warning" : "bg-primary"}`} style={{ width: `${pct}%` }} />
        </div>
      ) : null}
      {cheio ? <p className="mt-2 font-medium text-danger">Limite do plano atingido: {recurso === "produtos" ? "arquive produtos que não vende mais ou mude de plano para cadastrar novos. Os que já estão na loja continuam vendendo." : "mude de plano para convidar mais pessoas."}</p>
        : alerta ? <p className="mt-2 text-warning">Você já usa {pct}% do limite do plano.</p> : null}
    </div>
  );
}
