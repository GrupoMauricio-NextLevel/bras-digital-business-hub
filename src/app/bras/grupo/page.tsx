import { Building2 } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { getGroupCompanies, GROUP_ROLE_LABEL } from "@/lib/domain/grupo";
import { listCarriers } from "@/lib/domain/cargas/cargas";
import { GroupCompaniesEditor } from "@/components/cargas/master-forms";
import { CarrierForm } from "@/components/cargas/cargas-forms";

export const dynamic = "force-dynamic";

const fmtCnpj = (v: string) => v.length === 14 ? `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12)}` : v;

/**
 * Empresas do grupo (D112): Starline, Mega Tron e NextLevel. Não são marcas; são quem fatura. O CNPJ liga cada uma ao
 * cadastro dela nas marcas (a Starline como transportadora) e dá o selo "empresa do grupo", que deixa a rede transparente.
 */
export default async function Grupo() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [companies, carriers] = await Promise.all([getGroupCompanies(db), listCarriers(db, session.actor)]);
  return (
    <>
      <PageHeader eyebrow="Estúdio Brás Digital Club · Pontos" title="Empresas do grupo" description={'Quem fatura em cada frente. Elas aparecem nas marcas com o selo "empresa do grupo", sem vantagem escondida na busca.'} />
      <ul className="mb-6 grid gap-3 lg:grid-cols-3">{companies.map((c) => {
        const carrier = c.cnpj ? carriers.find((x) => "document" in x && x.document === c.cnpj) : undefined;
        return (
          <li key={c.key} className="ds-card p-4 text-sm">
            <p className="flex items-center gap-2 text-base font-semibold"><Building2 className="size-5 text-[var(--brand-primary)]" aria-hidden />{c.tradeName || c.legalName}</p>
            <p className="text-muted-foreground">{c.legalName}</p>
            <p className="mt-1">{c.cnpj ? `CNPJ ${fmtCnpj(c.cnpj)}` : <span className="text-warning">CNPJ a completar</span>} · {GROUP_ROLE_LABEL[c.role]}</p>
            {c.notes ? <p className="mt-1 text-muted-foreground">{c.notes}</p> : null}
            {c.role === "TRANSPORTE" && c.cnpj ? (
              carrier ? <p className="mt-2"><Badge tone="success">Transportadora cadastrada</Badge> <a href="/bras/transportadoras" className="font-semibold text-link underline">Gerenciar</a></p>
                : <details className="mt-3 rounded-lg border border-dashed border-border p-3" open><summary className="cursor-pointer font-semibold">Cadastrar como transportadora</summary><p className="mt-2 text-muted-foreground">Nome e CNPJ já preenchidos. Complete o contato e o WhatsApp.</p><div className="mt-3"><CarrierForm defaults={{ name: c.tradeName || c.legalName, docType: "CNPJ", document: c.cnpj, operation: "EXCURSAO", vehicles: ["ONIBUS_EXCURSAO"], ufs: ["SP"], label: `Cadastrar ${c.tradeName || c.legalName}` }} /></div></details>
            ) : null}
          </li>
        );
      })}</ul>
      <section aria-labelledby="g-ed" className="ds-card p-4"><h2 id="g-ed" className="mb-3 text-base font-semibold">Editar empresas</h2><GroupCompaniesEditor companies={companies} /></section>
    </>
  );
}
