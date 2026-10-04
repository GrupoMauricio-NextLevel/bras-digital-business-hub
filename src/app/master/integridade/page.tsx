import { CheckCircle2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { runIntegrityReport } from "@/lib/domain/integrity";

export const dynamic = "force-dynamic";

export default async function IntegrityPage() {
  await requireRole("NEXTLEVEL_MASTER");
  const report = await runIntegrityReport(await getDb());
  return (
    <>
      <PageHeader title="Integridade dos dados" description="Conferência somente de leitura: nada é alterado. Cada linha é uma regra que os dados precisam respeitar (totais, estoque, números de pedido)." />
      <p className="mb-4 text-sm text-muted-foreground">{report.ok ? "Tudo certo: nenhuma regra violada." : "Há registros fora da regra. Veja os exemplos e investigue antes de qualquer correção."} Conferido em {new Date(report.checkedAt).toLocaleString("pt-BR")}.</p>
      <ul className="divide-y divide-border border border-border bg-surface">
        {report.checks.map((c) => (
          <li key={c.key} className="flex items-start gap-3 px-4 py-3">
            {c.violations === 0 ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{c.label}</div>
              {c.violations > 0 ? <div className="mt-1 break-all text-xs text-muted-foreground">{c.violations} registro(s). Exemplos: {c.sample.join(", ")}</div> : null}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
