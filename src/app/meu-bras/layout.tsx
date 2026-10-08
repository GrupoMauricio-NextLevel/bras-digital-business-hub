import { AlertTriangle } from "lucide-react";
import { requireRole } from "@/lib/require-session";
import { RoleLayout } from "@/components/app/role-layout";
import { getDb } from "@/db/client";
import { getBrasMemberByUser } from "@/lib/domain/bras/membros";
import "@/components/portal/bras/bras.css";

/** Meu Brás: área do membro comprador (D91). Só o papel BRAS_MEMBER entra; o resto volta ao próprio painel. */
export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("BRAS_MEMBER");
  const member = await getBrasMemberByUser(await getDb(), session.user.id);
  const banner = member?.status !== "ACTIVE" ? (
    <div role="alert" className="border-b border-danger/40 bg-danger-soft px-4 py-2.5 text-sm text-danger">
      <AlertTriangle className="mr-2 inline size-4 align-text-bottom" aria-hidden />
      <b>Cadastro em análise pela equipe.</b> Enquanto isso, preço e estoque ficam ocultos. Fale com a Brás Digital para regularizar.
    </div>
  ) : undefined;
  return <RoleLayout session={session} banner={banner}><div className="bd-home">{children}</div></RoleLayout>;
}
