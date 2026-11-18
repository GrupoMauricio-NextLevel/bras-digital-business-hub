import Link from "next/link";
import { FileText } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { contratosDoMaster, lojasParaContrato, pixParaConferir } from "@/lib/domain/contratos";
import { podeOperarCaixa } from "@/lib/domain/caixa";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { CancelarContrato, NovoContrato } from "./forms";
import { aceitesDoMaster } from "@/lib/domain/termos-plataforma";
import { VERSAO_TERMOS } from "@/lib/contratos/termos-plataforma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contratos" };

const quando = (iso: string | null) => (iso ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(iso)) : "—");
const SITUACAO: Record<string, { rotulo: string; tom: "warning" | "success" | "neutral" }> = { ENVIADO: { rotulo: "Aguardando aceite", tom: "warning" }, ACEITO: { rotulo: "Assinado", tom: "success" }, CANCELADO: { rotulo: "Cancelado", tom: "neutral" } };

/** Contratos (CT1+CT2, D276): a NextLevel assina ao enviar; o cliente aceita no painel; a cópia vai por e-mail aos dois. */
export default async function ContratosPage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const pode = podeOperarCaixa(session.actor);
  const [lista, lojas, conferir, aceites] = await Promise.all([contratosDoMaster(db, session.actor), pode ? lojasParaContrato(db, session.actor) : Promise.resolve([]), pode ? pixParaConferir(db, session.actor) : Promise.resolve([]), aceitesDoMaster(db, session.actor)]);
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  return (
    <>
      <PageHeader eyebrow="Comercial" title="Contratos" description="Crie o contrato da Loja Pronta Express, assine e envie. O cliente recebe um e-mail, entra com o login dele e aceita no painel. Com o aceite, a cópia assinada em PDF vai para os dois e-mails." />
      <p className="mb-5 rounded-xl border border-border bg-surface-muted/60 px-4 py-3 text-sm">Contratos de <b>serviço</b> (Loja Virtual Pronta Express, migração) agora são feitos e acompanhados no <b>Painel da Agência</b>, em Contratos, com sinal, restante, cortesias e aditivos. Os aceitos aqui podem ser trazidos para lá sem novo aceite. Os contratos da plataforma continuam aqui.</p>
      {conferir.length > 0 && (
        <section role="status" className="mb-6 rounded-xl border-2 border-[#b45309] bg-[#fff7ed] p-4 text-sm text-[#431407]" aria-labelledby="conferir-t">
          <h2 id="conferir-t" className="mb-2 font-semibold">{conferir.length === 1 ? "1 Pix para conferir no banco" : `${conferir.length} Pix para conferir no banco`}</h2>
          <ul className="grid gap-1">
            {conferir.map((p) => <li key={p.id}><Link className="font-medium underline underline-offset-2" href={`/master/contratos/${p.contratoId}`}>{p.numero}</Link> · {p.descricao} de {(p.valorCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · avisado em {quando(p.avisadoEm)}</li>)}
          </ul>
        </section>
      )}
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
                  {c.transferidoEm ? <Badge tone="info">Transferido para o Painel da Agência</Badge> : null}
                  <Link className="text-sm underline" href={`/master/contratos/${c.id}/pdf`} target="_blank">PDF</Link>
                  {c.status === "ENVIADO" && pode && <CancelarContrato id={c.id} />}
                </span>
              </li>
            ); })}
          </ul>
        )}
      </section>
      <section className="ds-card mt-6 p-5" aria-labelledby="termos-t">
        <h2 id="termos-t" className="text-base font-semibold">Termos de uso da plataforma · versão de {VERSAO_TERMOS.split("-").reverse().join("/")}</h2>
        <p className="mb-3 text-sm text-muted-foreground">Todo dono de loja aceita no painel antes de usar; sem o aceite, o painel não abre. {aceites.filter((a) => a.aceite).length} de {aceites.length} já aceitaram. <Link className="underline" href="/termos" target="_blank">Ler os termos</Link></p>
        {aceites.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma loja ainda.</p> : (
          <ul className="divide-y text-sm">
            {aceites.map((a) => (
              <li key={a.userId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="min-w-0"><span className="font-medium">{a.loja}</span> · {a.nome}</span>
                {a.aceite ? <span className="text-xs text-muted-foreground"><Badge tone="success">Aceito</Badge> {quando(a.aceite.aceitoEm)} · {a.aceite.ip ?? "IP não informado"}</span> : <Badge tone="warning">Ainda não aceitou</Badge>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
