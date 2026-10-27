import { PageHeader } from "@/components/app/page-header";
import { requireIndependent } from "@/lib/require-independent";
import { getDb } from "@/db/client";
import { ERPS, painelErp } from "@/lib/domain/erp";
import { formatDateTime } from "@/lib/utils";
import { ConectarErp, DesconectarErp, TentarDeNovo } from "./forms";

export const dynamic = "force-dynamic";

const SITUACAO = { PENDENTE: "Na fila", ENVIADO: "Enviado", ERRO: "Com erro" } as const;

/** ERP da loja (Rodada C, D191): Tiny ou Omie recebem os pedidos pagos e devolvem o estoque. */
export default async function ErpPage() {
  const { session } = await requireIndependent();
  const p = await painelErp(await getDb(), session.actor);
  return (
    <>
      <PageHeader title="ERP (Tiny ou Omie)" description="Cada pedido pago vai sozinho para o seu ERP, e o estoque do ERP volta para a loja a cada 15 minutos." />
      <div className="space-y-6">
        <section aria-labelledby="erp-conexao" className="ds-card space-y-3">
          <h2 id="erp-conexao" className="text-lg font-semibold">Conexão</h2>
          {p.provider ? (
            <>
              <p className="text-sm text-body">Conectado ao <b>{ERPS[p.provider].nome}</b>{p.conta ? ` · ${p.conta}` : ""}{p.desde ? `, desde ${formatDateTime(p.desde)}` : ""}. Pedidos pagos a partir da conexão são enviados.</p>
              <p className="text-sm text-muted-foreground">Estoque: {p.estoque ? `última leitura em ${formatDateTime(p.estoque)}` : "primeira leitura em até 10 minutos"}. Vale o código (SKU) igual nos dois lados; produto sem SKU igual não muda.</p>
              <DesconectarErp />
            </>
          ) : <ConectarErp />}
        </section>
        <section aria-labelledby="erp-envios" className="ds-card space-y-3">
          <h2 id="erp-envios" className="text-lg font-semibold">Últimos pedidos enviados</h2>
          {p.envios.length ? (
            <ul className="divide-y divide-border rounded-lg border border-border text-sm">
              {p.envios.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <span>Pedido {e.numero}{e.externoId ? <span className="text-muted-foreground"> · no ERP: {e.externoId}</span> : null}</span>
                  <span className="flex items-center gap-3">
                    <span className={e.status === "ERRO" ? "text-danger" : e.status === "ENVIADO" ? "text-success" : "text-muted-foreground"}>{SITUACAO[e.status]}{e.status === "ERRO" ? ` (${e.tentativas} tentativa${e.tentativas > 1 ? "s" : ""})` : ""}</span>
                    {e.status === "ERRO" ? <TentarDeNovo id={e.id} /> : null}
                  </span>
                  {e.erro && e.status === "ERRO" ? <span className="w-full text-xs text-muted-foreground">{e.erro}</span> : null}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Nenhum pedido enviado ainda.</p>}
        </section>
      </div>
    </>
  );
}
