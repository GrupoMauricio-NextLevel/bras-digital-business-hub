import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { formatCnpj, getBrasMemberByUser } from "@/lib/domain/bras/membros";
import { brasWhatsappUrl } from "@/lib/bras/contato";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Empresa() {
  const session = await requireRole("BRAS_MEMBER");
  const m = await getBrasMemberByUser(await getDb(), session.user.id);
  const ajuda = brasWhatsappUrl("Olá! Preciso alterar o cadastro da minha empresa no Brás Digital Club.");
  const rows: [string, React.ReactNode][] = m ? [
    ["Empresa", m.companyName], ["CNPJ", <span key="c" className="tabular-nums">{formatCnpj(m.cnpj)}</span>], ["Responsável", session.user.name], ["E-mail", session.user.email],
    ["WhatsApp", <span key="w" className="tabular-nums">{m.whatsapp}</span>], ["Membro desde", formatDate(m.createdAt, { day: "2-digit", month: "long", year: "numeric" })],
    ["Situação", m.status === "ACTIVE" ? <Badge key="s" tone="success">Ativo</Badge> : <Badge key="s" tone="danger">Em análise</Badge>],
  ] : [];
  return (
    <>
      <PageHeader eyebrow="Meu Brás" title="Minha empresa" description="Estes dados ficam só com o Brás Digital Club. A importadora recebe apenas o endereço de envio de cada pedido." />
      <dl className="ds-card divide-y divide-border">
        {rows.map(([k, v]) => <div key={k} className="grid gap-1 p-4 sm:grid-cols-[12rem_1fr]"><dt className="text-sm text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}
      </dl>
      <p className="mt-4 text-sm text-muted-foreground">Para alterar algum dado, {ajuda ? <a href={ajuda} target="_blank" rel="noreferrer" className="font-semibold text-link underline">fale com a equipe pelo WhatsApp</a> : "fale com a equipe do Brás Digital Club"}. A senha você troca no menu da sua conta.</p>
    </>
  );
}
