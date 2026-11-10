import Link from "next/link";
import { FileText } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { contratosDoMaster, lojasParaContrato } from "@/lib/domain/contratos";
import { podeOperarCaixa } from "@/lib/domain/caixa";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { CancelarContrato, NovoContrato } from "./forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contratos" };

const quando = (iso: string | null) => (iso ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(iso)) : "—");
const SITUACAO: Record<string, { rotulo: string; tom: "warning" | "success" | "neutral" }> = { ENVIADO: { rotulo: "Aguardando aceite", tom: "warning" }, ACEITO: { rotulo: "Assinado", tom: "success" }, CANCELADO: { rotulo: "Cancelado", tom: "neutral" } };

/** Contratos (CT1+CT2, D276): a NextLevel assina ao enviar; o cliente aceita no painel; a cópia vai por e-mail aos dois. */
export default async function ContratosPage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const pode = podeOperarCaixa(session.actor);
  const [lista, lojas] = await Promise.all([contratosDoMaster(db, session.actor), pode ? lojasParaContrato(db, session.actor) : Promise.resolve([])]);
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  return (
    <>
      <PageHeader eyebrow="Comercial" title="Contratos" description="Crie o contrato da Loja Pronta Express, assine e envie. O cliente recebe um e-mail, entra com o login dele e aceita no painel. Com o aceite, a cópia assinada em PDF vai para os dois e-mails." />
      {pode && (
        <section className="ds-card mb-6 p-5" aria-labelledby="novo-t">
          <h2 id="novo-t" className="mb-3 text-base font-semibold">Novo contrato · Loja Virtual Pronta Express</h2>
          <NovoContrato lojas={lojas} hoje={hoje} />
        </section>
      )}
      <section className="ds-card p-5" aria-labelledby="lista-t">
        <h2 id="lista-t" className="mb-3 text-base font-semibold">Contratos enviados</h2>
        {lista.length === 0 ? <EmptyState icon={FileText} title="Nenhum contrato ainda" description="O primeiro contrato que você enviar aparece aqui, com a situação do aceite." /> : (
          <ul className="divide-y">
            {lista.map((c) => { const s = SITUACAO[c.status]!; return (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium"><Link className="underline-offset-2 hover:underline" href={`/master/contratos/${c.id}`}>{c.numero}</Link> · {c.titulo}</p>
                  <p className="text-xs text-muted-foreground">Enviado em {quando(c.enviadoEm)}{c.aceitoEm ? ` · aceito por ${c.aceitoNome} em ${quando(c.aceitoEm)}` : ""}</p>
                </div>
                <span className="flex items-center gap-2">
                  <Badge tone={s.tom}>{s.rotulo}</Badge>
                  <Link className="text-sm underline" href={`/master/contratos/${c.id}/pdf`} target="_blank">PDF</Link>
                  {c.status === "ENVIADO" && pode && <CancelarContrato id={c.id} />}
                </span>
              </li>
            ); })}
          </ul>
        )}
      </section>
    </>
  );
}
