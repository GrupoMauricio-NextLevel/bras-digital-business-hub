import { FileSignature } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { escopoDaAgencia, pode } from "@/lib/agencias/acesso";
import { hojeEmSaoPaulo, listarClientes } from "@/lib/agencias/clientes";
import { contratosDaAgencia } from "@/lib/agencias/contratos";
import { THEME_CATALOG, isReleased } from "@/lib/themes/catalog";
import { NovoContrato } from "../contratos-cliente";

export const dynamic = "force-dynamic";
export const metadata = { title: "Novo contrato" };

/** Novo contrato da agência (D342): Loja Virtual Pronta Express, migração ou mensalidade, com prévia do texto exato. */
export default async function NovoContratoPage({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const session = await requireRole("AGENCY");
  const db = await getDb();
  const { membro } = await escopoDaAgencia(db, session.actor);
  if (!pode.editarContrato(membro)) return <><PageHeader title="Novo contrato" backHref="/agencia/contratos" /><EmptyState icon={FileSignature} title="Os contratos são do administrador e do financeiro" description="Fale com o administrador da agência." /></>;
  const sp = await searchParams;
  const [clientes, contratos] = await Promise.all([listarClientes(db, session.actor), contratosDaAgencia(db, session.actor)]);
  const opcoes = clientes.filter((c) => c.situacao !== "ENCERRADO").map((c) => ({
    id: c.id, nome: c.nome, temEmail: !!c.email, temDocumento: !!c.documento,
    aceitos: contratos.lista.filter((k) => k.clienteId === c.id && k.status === "ACEITO").map((k) => ({ id: k.id, numero: k.numero })),
  }));
  const temas = THEME_CATALOG.filter((t) => t.priceCents > 0 && isReleased(t)).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")).map((t) => ({ key: t.key, nome: t.name, precoCents: t.priceCents }));
  const inicial = sp.cliente && opcoes.some((c) => c.id === sp.cliente) ? sp.cliente : null;
  return (
    <div className="mx-auto max-w-[1240px] space-y-5">
      <PageHeader backHref="/agencia/contratos" eyebrow="Contratos" title="Novo contrato" description="Escolha o cliente e o serviço, diga o que já foi pago e confira a prévia. O envio é a assinatura da agência; o cliente aceita no portal e a cópia assinada chega por e-mail aos dois lados." />
      {opcoes.length ? <NovoContrato clientes={opcoes} clienteInicial={inicial} hoje={hojeEmSaoPaulo()} temas={temas} temaPadrao={temas.some((t) => t.key === "aura") ? "aura" : null} />
        : <EmptyState icon={FileSignature} title="Cadastre o cliente primeiro" description="O contrato sai com os dados da ficha do cliente." />}
    </div>
  );
}
