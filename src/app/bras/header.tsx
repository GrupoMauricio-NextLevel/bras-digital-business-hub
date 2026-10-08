import { ExternalLink, Inbox, PlayCircle, UserCheck, UserX } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { brandByCode } from "@/lib/brand";

const cadastrosRecentes = (rows: { createdAt: string }[], dias = 7) => { const desde = Date.now() - dias * 86_400_000; return rows.filter((m) => new Date(m.createdAt).getTime() >= desde).length; };

/** Cabeçalho comum do Estúdio: título da página, aviso de cadastro fechado e os números do dia. */
export function EstudioHeader({ title, description, members, videos, requests }: {
  title: string; description: string;
  members: { status: string; createdAt: string }[]; videos: { active: boolean }[]; requests: { r: { status: string } }[];
}) {
  const brand = brandByCode("BRAS_DIGITAL");
  const ativos = members.filter((m) => m.status === "ACTIVE").length;
  const novos = requests.filter((x) => x.r.status === "NEW").length;
  return (
    <>
      <PageHeader eyebrow="Estúdio Brás Digital" title={title} description={description}
        actions={<a href={brand.baseUrl} target="_blank" rel="noreferrer" className="ds-btn ds-btn--secondary ds-btn--sm"><ExternalLink className="size-4" aria-hidden />Ver página pública</a>} />
      {!brand.signupOpen ? (
        <p role="note" className="mb-6 rounded-lg border border-warning/40 bg-warning-soft/40 p-4 text-sm">
          <strong>Cadastro ainda fechado.</strong> O endereço da Brás mostra a página &quot;em breve&quot;. Para abrir a página pública e o cadastro grátis, ligue a configuração <code>BRAND_SIGNUP_BRAS_DIGITAL=true</code> no servidor.
        </p>
      ) : null}
      <MetricGrid className="mb-6">
        <MetricCard label="Pedidos para confirmar" value={novos} icon={Inbox} tone={novos ? "warning" : "neutral"} hint={`${requests.length} no total`} href="/bras" />
        <MetricCard label="Membros ativos" value={ativos} icon={UserCheck} tone="success" hint={`${cadastrosRecentes(members)} nos últimos 7 dias`} href="/bras/membros" />
        <MetricCard label="Bloqueados" value={members.length - ativos} icon={UserX} tone={members.length - ativos ? "warning" : "neutral"} href="/bras/membros" />
        <MetricCard label="Vídeos publicados" value={videos.filter((v) => v.active).length} icon={PlayCircle} hint={`${videos.length} na lista`} href="/bras/videos" />
      </MetricGrid>
    </>
  );
}
