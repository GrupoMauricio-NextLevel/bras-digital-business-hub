import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { configPublica, getIaConfig, mauricioDaLoja } from "@/lib/domain/ia";
import { CentralIa } from "@/components/ia/central";
import { AjustesIa, ChaveIa } from "./forms";
import { AbasIa } from "../abas";

export const dynamic = "force-dynamic";

/** Maurício no Master (IA0, D194): credenciais do GPT, chaves, planos e cotas. Só o dono altera. */
export default async function MauricioMasterPage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const c = configPublica(await getIaConfig(db));
  const dono = !session.actor.masterFunction;
  const sec = "ds-card space-y-4";
  return (
    <>
      <PageHeader title="Central da IA" description="Credenciais do GPT, o que fica visível e o que cada plano libera. Sem chave, o Maurício aparece só no visual, sem custo." />
      <AbasIa atual="ajustes" />
      <div className="space-y-6">
        <section aria-labelledby="ia-chave" className={sec}>
          <h2 id="ia-chave" className="text-lg font-semibold">Credenciais da OpenAI (GPT)</h2>
          {dono ? <ChaveIa temChave={c.temChave} fim={c.chaveFim} testadoEm={c.testadoEm} testeOk={c.testeOk} /> : <p className="text-sm text-body">Só o dono altera as credenciais.</p>}
        </section>
        <section aria-labelledby="ia-ajustes" className={sec}>
          <h2 id="ia-ajustes" className="text-lg font-semibold">Ligar, planos e cotas</h2>
          {dono ? <AjustesIa podeUsoReal={c.temChave && c.testeOk} inicial={{ mostrar: c.mostrar, usoReal: c.usoReal, organizacao: c.organizacao, modeloPadrao: c.modeloPadrao, modeloEconomico: c.modeloEconomico, planoTexto: c.planoTexto, planoAvancado: c.planoAvancado, cotas: c.cotas }} /> : <p className="text-sm text-body">Só o dono altera estes ajustes.</p>}
        </section>
        <section aria-labelledby="ia-previa" className="space-y-4">
          <h2 id="ia-previa" className="text-lg font-semibold">Como as lojas veem (prévia)</h2>
          <CentralIa m={await mauricioDaLoja(db, null, { master: true })} upgrade="/master/ia" />
        </section>
      </div>
    </>
  );
}
