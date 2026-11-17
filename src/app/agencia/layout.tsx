import { notFound } from "next/navigation";
import { requireRole } from "@/lib/require-session";
import { RoleLayout } from "@/components/app/role-layout";
import { getDb } from "@/db/client";
import { agenciasLigado, escopoDaAgencia, FUNCAO_ROTULO } from "@/lib/agencias/acesso";

export const dynamic = "force-dynamic";

/** Painel da Agência (D313): login próprio (papel AGENCY), só com a chave AGENCIAS_V1, só a própria agência. */
export default async function Layout({ children }: { children: React.ReactNode }) {
  if (!agenciasLigado()) notFound();
  const session = await requireRole("AGENCY");
  const r = await escopoDaAgencia(await getDb(), session.actor).catch((e: Error) => ({ erro: e.message }));
  if ("erro" in r) {
    return <RoleLayout session={session} banner={<div role="alert" className="border-b border-danger/40 bg-danger-soft px-4 py-2.5 text-sm text-danger">{r.erro}</div>}>{null}</RoleLayout>;
  }
  return (
    <RoleLayout session={session} tenant={{ name: r.agencia.nome, sub: `${FUNCAO_ROTULO[r.membro.funcao]} · Painel da Agência` }}>
      {children}
    </RoleLayout>
  );
}
