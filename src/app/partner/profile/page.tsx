import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { partnerOfActor, pixKeyOf } from "@/lib/domain/partners";
import { formatDate } from "@/lib/utils";
import { ProfileForm } from "../partner-client";

export const dynamic = "force-dynamic";

export default async function PartnerProfile() {
  const session = await requireRole("AFFILIATE");
  const p = await partnerOfActor(await getDb(), session.actor);
  return (
    <>
      <PageHeader title="Meu perfil" description={`Código de parceiro ${p.code} · CPF/CNPJ final ${p.taxId.slice(-4)}`} />
      <Card><CardContent className="space-y-4 pt-5">
        <ProfileForm phone={p.phone} displayName={p.displayName} hasPix={!!pixKeyOf(p)} />
        <p className="text-sm text-muted-foreground">Termos do programa aceitos em {formatDate(p.termsAcceptedAt)} (versão {p.termsVersion}). <Link href="/parceiros/termos" className="font-medium underline">Ler os termos</Link> · <Link href="/account/password" className="font-medium underline">Trocar a senha</Link></p>
      </CardContent></Card>
    </>
  );
}
