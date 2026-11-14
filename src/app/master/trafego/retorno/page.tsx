import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { configRetorno, painelRetorno, ROTULO_EVENTO, type Evento } from "@/lib/domain/trafego/retorno";
import { formatDateTime } from "@/lib/utils";
import { AbasTrafego } from "../abas";
import { FormRetorno, Reenviar } from "./form";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { rotulo: string; tom: "success" | "warning" | "danger" | "neutral" | "info" }> = {
  PENDENTE: { rotulo: "Na fila", tom: "info" }, ENVIADO: { rotulo: "Entregue", tom: "success" }, FALHOU: { rotulo: "Falhou", tom: "danger" },
  IGNORADO: { rotulo: "Não se aplica", tom: "neutral" }, BLOQUEADO: { rotulo: "Recusou anúncios", tom: "warning" },
};

/** Tráfego e campanhas → Retorno às plataformas (TR5, D298). */
export default async function RetornoPage() {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [cfg, p] = await Promise.all([configRetorno(db), painelRetorno(db, s.actor)]);
  const n = (plat: string, st: string) => p.contagem.find((c) => c.plataforma === plat && c.status === st)?.n ?? 0;
  return (
    <>
      <PageHeader eyebrow="Crescimento" title="Tráfego e campanhas" description="Quem deixou contato, criou a loja, virou pagante ou fechou negócio volta para a Meta e o Google, para as campanhas aprenderem quem vira cliente." />
      <AbasTrafego ativa="retorno" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="grid content-start gap-6">
          <section className="grid gap-3 sm:grid-cols-2" aria-label="Situação por plataforma">
            {([["META", "Meta (Instagram e Facebook)", cfg.meta.pronto, cfg.meta.pixel ? null : "Falta o número do Pixel (aba Pixel e Google)."], ["GOOGLE", "Google Ads", cfg.google.pronto, null]] as const).map(([k, nome, pronto, falta]) => (
              <div key={k} className="ds-card text-sm">
                <div className="flex flex-wrap items-center gap-2"><b>{nome}</b><Badge tone={pronto ? "success" : "neutral"} dot>{pronto ? "Ligado" : "Desligado"}</Badge></div>
                {falta ? <p className="mt-1 text-xs text-muted-foreground">{falta}</p> : null}
                <dl className="mt-3 grid grid-cols-2 gap-2">
                  {(["ENVIADO", "PENDENTE", "FALHOU", "BLOQUEADO"] as const).map((st) => <div key={st}><dt className="text-xs text-muted-foreground">{STATUS[st]!.rotulo}</dt><dd className="text-xl font-bold tabular-nums">{n(k, st)}</dd></div>)}
                </dl>
              </div>
            ))}
          </section>
          <section className="ds-card min-w-0 text-sm" aria-labelledby="fila-t">
            <h2 id="fila-t" className="text-lg font-bold">Últimos resultados</h2>
            <p className="mt-1 text-muted-foreground">Sem configuração, a fila espera: quando você ligar, o que ainda estiver dentro do prazo (7 dias na Meta, 90 no Google) é enviado.</p>
            {p.ultimos.length === 0 ? <p className="mt-4 text-muted-foreground">Nada ainda. Assim que alguém deixar contato ou criar a loja, aparece aqui.</p> : (
              <ul className="mt-3 divide-y divide-border">
                {p.ultimos.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2"><b>{ROTULO_EVENTO[l.evento as Evento]}</b><span className="text-muted-foreground">{l.plataforma === "META" ? "Meta" : "Google"}</span><Badge tone={STATUS[l.status]!.tom}>{STATUS[l.status]!.rotulo}</Badge>{l.valorCents ? <span className="tabular-nums">{(l.valorCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span> : null}</p>
                      <p className="mt-0.5 break-all text-xs text-muted-foreground">{l.nome ? <><span className="font-medium text-foreground">{l.nome}</span> · </> : null}{formatDateTime(l.ocorreuEm)}{l.motivo ? ` · ${l.motivo}` : ""}</p>
                    </div>
                    {l.status === "FALHOU" || l.status === "IGNORADO" && /configurad/.test(l.motivo ?? "") ? <Reenviar id={l.id} /> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <FormRetorno cfg={cfg} podeEditar={!s.user.masterFunction} />
      </div>
    </>
  );
}
