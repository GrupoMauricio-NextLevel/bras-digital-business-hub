import { SlidersHorizontal } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { vocabularioDaAgencia } from "@/lib/agencias/personalizar";
import { MODELOS, SEGMENTOS, vocabulario } from "@/lib/agencias/personalizacao";
import { AGENCIA_FUNCOES, PECA_ETAPAS, PECA_TIPOS } from "@/db/schema";
import { Personalizar, type Estado } from "./personalizar-cliente";

export const dynamic = "force-dynamic";

/** Estado completo da tela (nomes, departamentos, etapas, tipos, gavetas) a partir de um vocabulário resolvido. */
function estadoDe(v: ReturnType<typeof vocabulario>): Estado {
  return {
    segmento: v.segmento, nomes: { ...v.nomes },
    funcoes: Object.fromEntries(AGENCIA_FUNCOES.map((k) => [k, { ...v.funcoes[k] }])) as Estado["funcoes"],
    etapas: Object.fromEntries(PECA_ETAPAS.map((k) => [k, { ...v.etapas[k] }])) as Estado["etapas"],
    tipos: Object.fromEntries(PECA_TIPOS.map((k) => [k, { ...v.tipos[k] }])) as Estado["tipos"],
    modulos: { ...v.modulos }, exigirLinks: v.exigirLinks,
  };
}

/**
 * Personalizar o painel (D340): o administrador escolhe o modelo do segmento e edita nomes, departamentos, etapas do
 * fluxo, tipos de entrega e as gavetas do menu. Serve agência e qualquer empresa de serviços (foco 50% / 50%).
 */
export default async function PersonalizarPainel() {
  const session = await requireRole("AGENCY");
  const db = await getDb();
  const { v, membro } = await vocabularioDaAgencia(db, session.actor);
  if (membro.funcao !== "ADMIN") return <><PageHeader title="Personalizar o painel" /><EmptyState icon={SlidersHorizontal} title="Só o administrador personaliza" description="Peça ao administrador da empresa para mudar nomes, departamentos e etapas." /></>;
  const modelos = Object.fromEntries(SEGMENTOS.map((s) => [s, estadoDe(vocabulario({ segmento: s }))])) as Record<string, Estado>;
  const rotulos = SEGMENTOS.map((s) => ({ chave: s, rotulo: MODELOS[s].rotulo, descricao: MODELOS[s].descricao }));
  return (
    <>
      <PageHeader eyebrow={v.nomes.painel} title="Personalizar o painel" description="Deixe o painel com a cara da sua empresa: escolha o modelo do seu segmento e mude os nomes, os departamentos, as etapas do trabalho e o que aparece no menu. Vale para toda a equipe e para o portal dos clientes." />
      <Personalizar atual={estadoDe(v)} modelos={modelos} segmentos={rotulos} />
    </>
  );
}
