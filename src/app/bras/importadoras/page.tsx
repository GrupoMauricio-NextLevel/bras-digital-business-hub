import { requireRole } from "@/lib/require-session";
import { DefaultCommission, ImportersManager } from "../catalogo-client";
import { getDb } from "@/db/client";
import { getBrasDefaultCommissionBps } from "@/lib/domain/bras/comissoes";
import { brasPanelsEnabled } from "@/lib/bras/panels";
import { EstudioHeader } from "../header";
import { estudioData } from "../data";
import { listPendingSuppliers, POLO_LABEL, SUPPLIER_TYPE_LABEL } from "@/lib/domain/bras/fornecedores";
import { AprovarFornecedores } from "./aprovar-client";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Importadoras() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const d = await estudioData(session.actor);
  const db = await getDb();
  const defaultBps = await getBrasDefaultCommissionBps(db);
  const pendentes = await listPendingSuppliers(db, session.actor);
  return (
    <>
      <EstudioHeader title="Importadoras" description="Importadoras, distribuidores e atacadistas da rede. Quem se cadastra em /fornecer aparece primeiro para aprovação." {...d} />
      {pendentes.length ? <AprovarFornecedores itens={pendentes.map((p) => ({ id: p.id, name: p.name, legalName: p.legalName, cnpj: p.cnpj ? p.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : null, tipo: SUPPLIER_TYPE_LABEL[p.supplierType], polo: POLO_LABEL[p.polo], categories: p.categories, description: p.description, contato: p.contacts.map((c) => [c.name, c.phone, c.email].filter(Boolean).join(" · ")).join(" / "), enviadoEm: p.submittedAt ? formatDateTime(p.submittedAt) : "—" }))} /> : null}
      <DefaultCommission bps={defaultBps} />
      <ImportersManager balcao={brasPanelsEnabled()} defaultBps={defaultBps} importers={d.importers.map((i) => ({ id: i.id, name: i.name, notes: i.notes, active: i.active, pickupAddress: i.pickupAddress, commissionBps: i.commissionBps, hasBalcaoLink: !!i.balcaoTokenHash }))} />
    </>
  );
}
