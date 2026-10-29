import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { CHAVES_MENSAGEM, getConfigComercial, ROTULO_MENSAGEM } from "@/lib/domain/comercial-config";
import { PageHeader } from "@/components/app/page-header";
import { LinkTabs } from "@/components/app/link-tabs";
import { FormAjustesComercial } from "./form";

export const dynamic = "force-dynamic";

/** Ajustes do Comercial (D205): o que a equipe usa todo dia, editável sem programador. */
export default async function AjustesComercialPage() {
  await requireRole("NEXTLEVEL_MASTER");
  const cfg = await getConfigComercial(await getDb());
  return (
    <>
      <PageHeader eyebrow="NextLevel E-commerce" title="Comercial" description="Meta do mês, quanto tempo de espera acende o alerta e as mensagens prontas de WhatsApp." />
      <LinkTabs label="Comercial" active="ajustes" items={[{ key: "quadro", label: "Funil", href: "/master/comercial" }, { key: "ajustes", label: "Meta e mensagens", href: "/master/comercial/ajustes" }]} />
      <FormAjustesComercial inicial={cfg} rotulos={CHAVES_MENSAGEM.map((k) => [k, ROTULO_MENSAGEM[k]] as const)} />
    </>
  );
}
