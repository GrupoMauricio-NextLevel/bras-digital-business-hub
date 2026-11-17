import { notFound } from "next/navigation";
import { requireRole } from "@/lib/require-session";
import { RoleLayout } from "@/components/app/role-layout";
import { getDb } from "@/db/client";
import { agenciasLigado, escopoDaAgencia, FUNCAO_ROTULO, pode } from "@/lib/agencias/acesso";
import { movimentarDemo } from "@/lib/agencias/demo";
import { ChaveModoDemo } from "@/components/agencia/modo-demo";

export const dynamic = "force-dynamic";

/** Painel da Agência (D313): login próprio (papel AGENCY), só com a chave AGENCIAS_V1, só a própria agência. */
export default async function Layout({ children }: { children: React.ReactNode }) {
  if (!agenciasLigado()) notFound();
  const session = await requireRole("AGENCY");
  const db = await getDb();
  const r = await escopoDaAgencia(db, session.actor).catch((e: Error) => ({ erro: e.message }));
  if ("erro" in r) {
    return <RoleLayout session={session} banner={<div role="alert" className="border-b border-danger/40 bg-danger-soft px-4 py-2.5 text-sm text-danger">{r.erro}</div>}>{null}</RoleLayout>;
  }
  // Modo demonstração (D326): no sandbox, a produção anda sozinha a cada visita e uma faixa avisa que nada ali é real.
  const demo = !!r.agencia.demoDeId;
  if (demo) await movimentarDemo(db, r.agencia.id).catch(() => null);
  return (
    <RoleLayout session={session} banner={demo ? <div role="status" className="flex flex-wrap items-center justify-between gap-2 border-b border-warning/40 bg-warning-soft px-4 py-2 text-sm"><span><b>Modo demonstração.</b> Equipe, clientes e números inventados, com a produção andando sozinha. Nada aqui mexe na sua agência real.</span><ChaveModoDemo ligado /></div> : undefined} tenant={{ name: r.agencia.nome, sub: `${FUNCAO_ROTULO[r.membro.funcao]} · Painel da Agência` }} ocultar={[...(pode.editarClientes(r.membro) ? [] : ["/agencia/comercial"]), ...(pode.editarContrato(r.membro) ? [] : ["/agencia/financeiro"]), ...(r.membro.funcao === "ADMIN" ? [] : ["/agencia/solucoes"]), ...(pode.trafego(r.membro) ? [] : ["/agencia/trafego"]), ...(pode.verValores(r.membro) ? [] : ["/agencia/crescimento"])]}>
      {children}
    </RoleLayout>
  );
}
