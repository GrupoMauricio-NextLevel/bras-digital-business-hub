import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { requireRole } from "@/lib/require-session";
import { RoleLayout } from "@/components/app/role-layout";
import { getDb } from "@/db/client";
import { partnerOfActor } from "@/lib/domain/partners";
import { formatBRL } from "@/lib/money";
import { getPartnerSettings } from "@/lib/domain/partners";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("AFFILIATE");
  const db = await getDb();
  const p = await partnerOfActor(db, session.actor);
  const fee = (await getPartnerSettings(db)).inactiveFeeCents;
  const banner = p.status === "INACTIVE" ? (
    <div role="status" className="border-b border-warning/40 bg-warning-soft px-4 py-2.5 text-sm text-warning">
      <AlertTriangle className="mr-2 inline size-4 align-text-bottom" aria-hidden />
      <b>Cadastro inativo neste mês.</b> Seus links e cupons estão pausados, mas você continua recebendo as mensalidades dos clientes que já indicou.{" "}
      <Link href="/partner/finance#reativar" className="font-semibold underline">Reativar por {formatBRL(fee)}/mês</Link>
    </div>
  ) : p.status === "SUSPENDED" ? (
    <div role="alert" className="border-b border-danger/40 bg-danger-soft px-4 py-2.5 text-sm text-danger"><b>Cadastro suspenso.</b> Fale com a NextLevel para regularizar.</div>
  ) : undefined;
  return <RoleLayout session={session} banner={banner}>{children}</RoleLayout>;
}
