import Link from "next/link";
import { ExternalLink, PlayCircle, UserCheck, UserX } from "lucide-react";
import { getDb } from "@/db/client";
import { PageHeader } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { LinkTabs } from "@/components/app/link-tabs";
import { requireRole } from "@/lib/require-session";
import { brandByCode } from "@/lib/brand";
import { BRAS_PANELS, canOpenBrasPanelPreview } from "@/lib/bras/panels";
import { listBrasMembers, formatCnpj } from "@/lib/domain/bras/membros";
import { listBrasVideosForMaster } from "@/lib/domain/bras/videos";
import { MembersTable, VideosManager } from "./estudio-client";

export const dynamic = "force-dynamic";

const cadastrosRecentes = (rows: { createdAt: string }[], dias = 7) => { const desde = Date.now() - dias * 86_400_000; return rows.filter((m) => new Date(m.createdAt).getTime() >= desde).length; };

/** Estúdio da Brás Digital dentro do Master (D91): vídeos da página pública e membros compradores. Só o Master. */
export default async function Estudio({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const tab = (await searchParams).tab === "membros" ? "membros" : "videos";
  const db = await getDb();
  const [members, videos] = await Promise.all([listBrasMembers(db, session.actor), listBrasVideosForMaster(db, session.actor)]);
  const brand = brandByCode("BRAS_DIGITAL");
  const ativos = members.filter((m) => m.status === "ACTIVE").length;
  const semana = cadastrosRecentes(members);
  const balcao = BRAS_PANELS.find((p) => p.key === "balcao")!;
  return (
    <>
      <PageHeader
        eyebrow="Brás Digital"
        title="Estúdio"
        description="Os vídeos que aparecem na página pública e no Meu Brás, e os membros que se cadastraram com CNPJ."
        actions={<a href={brand.baseUrl} target="_blank" rel="noreferrer" className="ds-btn ds-btn--secondary ds-btn--sm"><ExternalLink className="size-4" aria-hidden />Ver página pública</a>}
      />
      {!brand.signupOpen ? (
        <p role="note" className="mb-6 rounded-lg border border-warning/40 bg-warning-soft/40 p-4 text-sm">
          <strong>Cadastro ainda fechado.</strong> O endereço da Brás mostra a página &quot;em breve&quot;. Para abrir a página pública e o cadastro grátis, ligue a configuração <code>BRAND_SIGNUP_BRAS_DIGITAL=true</code> no servidor.
        </p>
      ) : null}
      <MetricGrid className="mb-6">
        <MetricCard label="Membros ativos" value={ativos} icon={UserCheck} tone="success" hint={`${semana} nos últimos 7 dias`} href="/master/bras?tab=membros" />
        <MetricCard label="Bloqueados" value={members.length - ativos} icon={UserX} tone={members.length - ativos ? "warning" : "neutral"} href="/master/bras?tab=membros" />
        <MetricCard label="Vídeos publicados" value={videos.filter((v) => v.active).length} icon={PlayCircle} hint={`${videos.length} na lista`} href="/master/bras" />
      </MetricGrid>
      <LinkTabs label="Áreas do Estúdio" active={tab} items={[{ key: "videos", label: "Vídeos", href: "/master/bras" }, { key: "membros", label: `Membros (${members.length})`, href: "/master/bras?tab=membros" }]} />
      {tab === "videos"
        ? <VideosManager videos={videos.map((v) => ({ id: v.id, youtubeId: v.youtubeId, title: v.title, summary: v.summary, active: v.active }))} />
        : <MembersTable members={members.map((m) => ({ id: m.id, companyName: m.companyName, cnpj: formatCnpj(m.cnpj), name: m.name, email: m.email, whatsapp: m.whatsapp, status: m.status, blockedReason: m.blockedReason, createdAt: m.createdAt }))} />}
      {canOpenBrasPanelPreview(session.actor) ? (
        <p className="mt-8 text-sm text-muted-foreground">Prévia da próxima área: <Link className="font-semibold text-link underline" href={balcao.path}>{balcao.name}</Link> ({balcao.audience}).</p>
      ) : null}
    </>
  );
}
