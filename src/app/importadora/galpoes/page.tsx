import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { brasStaffCan, listImporterAccess, listWarehouses, myImporter } from "@/lib/domain/bras/importadora";
import { AccessManager, ProfileEditor, WarehousesEditor } from "@/components/bras/importadora-forms";

export const dynamic = "force-dynamic";

/** Galpões, equipe e ficha da importadora (só o dono edita; a equipe vê os galpões). */
export default async function Galpoes() {
  const session = await requireRole("BRAS_IMPORTER");
  const db = await getDb();
  const me = await myImporter(db, session.actor);
  const dono = brasStaffCan(me.staffRole, "equipe");
  const [whs, people] = await Promise.all([listWarehouses(db, session.actor, null), dono ? listImporterAccess(db, session.actor, null) : Promise.resolve([])]);
  const i = me.importer;
  return (
    <>
      <PageHeader eyebrow="Importadora" title="Galpões, equipe e ficha" description="Onde a transportadora retira, quem da sua equipe usa o painel e as suas condições comerciais." />
      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="g-gal" className="ds-card p-4"><h2 id="g-gal" className="mb-3 text-base font-semibold">Galpões e pontos de retirada</h2><WarehousesEditor importerId={null} items={whs} canEdit={dono} /></section>
        {dono ? <section aria-labelledby="g-eq" className="ds-card p-4"><h2 id="g-eq" className="mb-3 text-base font-semibold">Equipe</h2><AccessManager importerId={null} people={people.map((p) => ({ ...p, disabledAt: p.disabledAt ? String(p.disabledAt) : null, lastLoginAt: p.lastLoginAt ? String(p.lastLoginAt) : null }))} master={false} myUserId={session.user.id} /></section> : null}
        {dono ? <section aria-labelledby="g-fi" className="ds-card p-4 xl:col-span-2"><h2 id="g-fi" className="mb-3 text-base font-semibold">Ficha comercial</h2><ProfileEditor importerId={null} master={false} value={{ legalName: i.legalName, cnpj: i.cnpj, stateRegistration: i.stateRegistration, description: i.description, origin: i.origin, pickupAddress: i.pickupAddress, categories: i.categories, contacts: i.contacts, minBoxes: i.minBoxes, minOrderCents: i.minOrderCents, paymentMethods: i.paymentMethods, prepDays: i.prepDays, exchangePolicy: i.exchangePolicy, stockMode: i.stockMode, plan: i.plan }} /></section> : null}
      </div>
    </>
  );
}
