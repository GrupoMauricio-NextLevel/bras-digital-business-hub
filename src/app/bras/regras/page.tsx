import Link from "next/link";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getBrasRules } from "@/lib/domain/bras/regras";
import { getBrasClassification, brasMaxScore } from "@/lib/domain/bras/perfil";
import { BRAS_LEGAL_DOCS, BRAS_LEGAL_LABEL, BRAS_LEGAL_TOKENS, getBrasLegal, renderBrasLegal } from "@/lib/domain/bras/juridico";
import { getCatalogItem, listCatalog } from "@/lib/domain/nl-catalog";
import { FAMILY_LABEL, STATUS_LABEL, priceLines } from "@/lib/finance/catalog-labels";
import { LinkTabs } from "@/components/app/link-tabs";
import { Badge } from "@/components/ui/badge";
import { EstudioHeader } from "../header";
import { estudioData } from "../data";
import { ClassificationEditor, CubageSimulator, LegalEditor, RulesEditor } from "./regras-client";

export const dynamic = "force-dynamic";

const ABAS = [
  { key: "planos", label: "Planos e preços" }, { key: "regras", label: "Regras" }, { key: "classificacao", label: "Classificação do cliente" },
  { key: "suporte", label: "Suporte por plano" }, { key: "juridico", label: "Jurídico" }, { key: "cubagem", label: "Simulador de cubagem" },
] as const;
type Aba = (typeof ABAS)[number]["key"];
const FAMILIAS = ["BRAS_MEMBER_PLAN", "BRAS_IMPORTER_PLAN", "CARRIER_PLAN", "BRAS_SERVICE", "ADS"] as const;

/** Brás: planos e regras (D108). Tudo que muda dinheiro, prazo ou acesso da Brás v2 e da NextLevel Cargas, num lugar só. */
export default async function Regras({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const pedida = (await searchParams).aba;
  const aba: Aba = ABAS.find((a) => a.key === pedida)?.key ?? "planos";
  const db = await getDb();
  const [d, rules, classification, legal, catalog, fee] = await Promise.all([
    estudioData(session.actor), getBrasRules(db), getBrasClassification(db), getBrasLegal(db),
    listCatalog(db, { includeUnpublished: true, families: [...FAMILIAS] }), getCatalogItem(db, { key: "BRAS_COTACAO_FORA_CATALOGO" }, { includeUnpublished: true }),
  ]);
  const { version, updatedAt, ...r } = rules;
  const feeCents = fee?.prices.ONE_TIME?.amountCents ?? null;
  return (
    <>
      <EstudioHeader title="Planos e regras" description="Preços, prazos, percentuais, classificação, suporte e textos jurídicos da Brás v2 e da NextLevel Cargas. Nada fixo no código." {...d} />
      <p className="mb-4 text-sm text-muted-foreground">Regras na versão <b>{version}</b>{updatedAt ? `, gravada em ${new Date(updatedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : " (padrão aceito pelo dono)"}. Cada gravação fica na auditoria com antes e depois.</p>
      <LinkTabs label="Seções" active={aba} items={ABAS.map((a) => ({ key: a.key, label: a.label, href: `/bras/regras?aba=${a.key}` }))} />
      <div className="mt-6">
        {aba === "planos" ? (
          <div className="space-y-6">
            <p role="note" className="rounded-lg border border-warning/40 bg-warning-soft/40 p-4 text-sm"><b>Tudo em rascunho.</b> Nenhum plano ou serviço é cobrado nem aparece para membro, importadora ou transportadora até você publicar no Financeiro Master. Preço novo é uma nova versão (o histórico fica). Os planos grátis de cada lado são a ausência de plano.</p>
            {FAMILIAS.map((f) => {
              const items = catalog.filter((c) => c.family === f);
              if (!items.length) return null;
              return (
                <section key={f} aria-labelledby={`fam-${f}`}>
                  <h2 id={`fam-${f}`} className="mb-3 text-base font-semibold">{FAMILY_LABEL[f]}</h2>
                  <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((p) => (
                      <li key={p.id} className="ds-card p-4">
                        <div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{p.name}</h3><Badge tone={p.status === "PUBLISHED" ? "success" : "neutral"}>{STATUS_LABEL[p.status]}</Badge></div>
                        <p className="mt-1 text-lg font-bold tabular-nums">{priceLines(p).main}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                        <Link href={`/master/financeiro/catalogo/${p.key}`} className="mt-3 inline-block text-sm font-semibold text-link underline">Editar preço e publicar</Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        ) : aba === "regras" || aba === "suporte" ? (
          <RulesEditor rules={r} only={aba === "suporte" ? "support" : "rules"} />
        ) : aba === "classificacao" ? (
          <ClassificationEditor value={classification} maxScore={brasMaxScore(classification)} />
        ) : aba === "juridico" ? (
          <LegalEditor
            entity={legal.entity}
            tokens={Object.entries(BRAS_LEGAL_TOKENS).map(([k, label]) => ({ k, label }))}
            docs={BRAS_LEGAL_DOCS.map((k) => ({ key: k, label: BRAS_LEGAL_LABEL[k], ...legal.docs[k], preview: renderBrasLegal(legal.docs[k].body, legal.entity, r, feeCents) }))}
          />
        ) : (
          <CubageSimulator cubage={r.cubage} />
        )}
      </div>
    </>
  );
}
