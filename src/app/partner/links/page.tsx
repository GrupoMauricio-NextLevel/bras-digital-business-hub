import QRCode from "qrcode";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { listLinks, partnerOfActor } from "@/lib/domain/partners";
import { getBaseUrl } from "@/lib/base-url";
import { CopyButton, CreateLinkForm, WhatsAppShare } from "../partner-client";

export const dynamic = "force-dynamic";
const PLAN = { DROP_MANUAL: "Drop manual", STORE_SUBDOMAIN: "Loja SuperDrop", STORE_OWN: "Loja própria" } as const;

export default async function PartnerLinks() {
  const session = await requireRole("AFFILIATE");
  const db = await getDb();
  const [p, links, base] = await Promise.all([partnerOfActor(db, session.actor), listLinks(db, session.actor), getBaseUrl()]);
  const main = links.find((l) => l.slug === p.code.toLowerCase()) ?? links[0];
  const url = (slug: string) => `${base}/r/${slug}`;
  const qr = main ? await QRCode.toString(url(main.slug), { type: "svg", margin: 1, width: 176, color: { dark: "#1c1917", light: "#ffffff" } }) : "";
  const pitch = (u: string) => `Quer ter uma loja online pronta, sem estoque? Conheça o SuperDrop e teste: ${u}`;
  return (
    <>
      <PageHeader title="Links de divulgação" description="Cada clique fica registrado. Quem se cadastrar por um link seu fica atribuído a você por 30 dias." />
      {main ? (
        <Card className="mb-8"><CardContent className="grid gap-5 pt-5 sm:grid-cols-[auto_1fr]">
          <div className="mx-auto rounded-lg border border-border bg-white p-2" role="img" aria-label="QR code do link principal" dangerouslySetInnerHTML={{ __html: qr }} />
          <div className="space-y-3">
            <h2 className="text-base font-semibold">Link principal</h2>
            <code className="block break-all rounded bg-surface-muted p-2 text-sm">{url(main.slug)}</code>
            <div className="flex flex-wrap gap-2"><CopyButton text={url(main.slug)} label="Copiar link" size="md" /><WhatsAppShare text={pitch(url(main.slug))} /></div>
            <p className="text-sm text-muted-foreground">Texto pronto: “{pitch(url(main.slug))}”</p>
          </div>
        </CardContent></Card>
      ) : null}
      <SectionTitle title="Criar link por campanha" description="Use um link por canal (Instagram, WhatsApp, YouTube…) para saber o que funciona." />
      <Card className="mb-8"><CardContent className="pt-5"><CreateLinkForm disabled={p.status !== "ACTIVE"} /></CardContent></Card>
      <SectionTitle title="Seus links" />
      <ul className="space-y-2">{links.map((l) => (
        <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3">
          <div className="min-w-0"><p className="text-sm font-medium">{l.label}{l.planKey ? <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-foreground">{PLAN[l.planKey]}</span> : null}</p><p className="truncate text-xs text-muted-foreground">{url(l.slug)}{l.campaign ? ` · campanha ${l.campaign}` : ""}</p></div>
          <div className="flex items-center gap-3"><span className="text-sm tabular-nums text-muted-foreground">{l.clicks} clique(s)</span><CopyButton text={url(l.slug)} /></div>
        </li>
      ))}</ul>
    </>
  );
}
