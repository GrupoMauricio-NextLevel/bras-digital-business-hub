import { CheckCircle2, CircleAlert } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getBrandHub } from "@/lib/domain/commerce-hub";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function CommerceSettingsPage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const hub = await getBrandHub(await getDb(), session.actor);
  return (
    <>
      <PageHeader eyebrow="Plataforma" title="Saúde da Commerce" description="Infraestrutura necessária para operar a marca, receber assinaturas e manter as lojas no ar." />
      <ul className="ds-card divide-y divide-border">
        {hub.checks.map((c) => (
          <li key={c.key} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
            {c.ok ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden /> : <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />}
            <div className="min-w-0 flex-1"><div className="text-sm font-bold">{c.label}</div><p className="mt-0.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">{c.hint}</p></div>
            <Badge tone={c.ok ? "success" : c.severity === "blocker" ? "danger" : "warning"}>{c.ok ? "OK" : c.severity === "blocker" ? "Bloqueia" : "Recomendado"}</Badge>
          </li>
        ))}
      </ul>
    </>
  );
}
