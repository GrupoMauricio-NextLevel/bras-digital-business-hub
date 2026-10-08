import { requireRole } from "@/lib/require-session";
import { formatCnpj } from "@/lib/domain/bras/membros";
import { MembersTable } from "../estudio-client";
import { EstudioHeader } from "../header";
import { estudioData } from "../data";

export const dynamic = "force-dynamic";

export default async function Membros() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const d = await estudioData(session.actor);
  return (
    <>
      <EstudioHeader title="Membros" description="Lojistas cadastrados com CNPJ. Entram liberados; bloqueie quem não for lojista." {...d} />
      <MembersTable members={d.members.map((m) => ({ id: m.id, companyName: m.companyName, cnpj: formatCnpj(m.cnpj), name: m.name, email: m.email, whatsapp: m.whatsapp, status: m.status, blockedReason: m.blockedReason, createdAt: m.createdAt }))} />
    </>
  );
}
