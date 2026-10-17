import Link from "next/link";
import { Factory, MapPin, MessageCircle, Package } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { getBrasMemberByUser } from "@/lib/domain/bras/membros";
import { listSupplierDirectory, POLOS, POLO_LABEL, SUPPLIER_CATEGORIES, SUPPLIER_TYPES, SUPPLIER_TYPE_LABEL, type Polo, type SupplierType } from "@/lib/domain/bras/fornecedores";
import { brasWhatsappUrl } from "@/lib/bras/contato";
import { brandByCode } from "@/lib/brand";

export const dynamic = "force-dynamic";

const pick = <T extends string>(v: string | undefined, list: readonly T[]): T | null => (v && (list as readonly string[]).includes(v) ? (v as T) : null);
const sel = "min-h-11 rounded-[var(--ds-r-control,0.75rem)] border border-border bg-surface px-3 text-sm";

/**
 * Diretório de fornecedores da rede (D160): só fornecedores aprovados, para membro com cadastro ativo. Mostra o perfil
 * comercial; a cotação ainda passa pela equipe (a cotação pelo sistema é a próxima fase).
 */
export default async function Fornecedores({ searchParams }: { searchParams: Promise<{ polo?: string; tipo?: string; cat?: string }> }) {
  const session = await requireRole("BRAS_MEMBER");
  const db = await getDb();
  const q = await searchParams;
  const filtro = { polo: pick<Polo>(q.polo, POLOS.map((p) => p.key)), supplierType: pick<SupplierType>(q.tipo, SUPPLIER_TYPES), category: pick(q.cat, SUPPLIER_CATEGORIES) };
  const member = await getBrasMemberByUser(db, session.user.id);
  const lista = member?.status === "ACTIVE" ? await listSupplierDirectory(db, session, session.actor, filtro) : null;
  const filtrando = !!(filtro.polo || filtro.supplierType || filtro.category);
  return (
    <>
      <PageHeader eyebrow="Meu Brás" title="Fornecedores" description="Importadoras, distribuidores e atacadistas aprovados pela equipe, começando pelo Canindé. Filtre pelo que você procura e peça a cotação." />
      <form method="get" className="mb-6 flex flex-wrap items-end gap-3" aria-label="Filtrar fornecedores">
        <label className="grid gap-1 text-sm font-semibold">Polo<select name="polo" defaultValue={filtro.polo ?? ""} className={sel}><option value="">Todos</option>{POLOS.map((p) => <option key={p.key} value={p.key}>{p.nome}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-semibold">Tipo<select name="tipo" defaultValue={filtro.supplierType ?? ""} className={sel}><option value="">Todos</option>{SUPPLIER_TYPES.map((t) => <option key={t} value={t}>{SUPPLIER_TYPE_LABEL[t]}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-semibold">Categoria<select name="cat" defaultValue={filtro.category ?? ""} className={sel}><option value="">Todas</option>{SUPPLIER_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
        <button type="submit" className="bd-btn bd-btn--primario min-h-11">Filtrar</button>
        {filtrando ? <Link href="/meu-bras/fornecedores" className="min-h-11 content-center text-sm font-semibold text-link underline">Limpar filtros</Link> : null}
      </form>
      {lista === null ? (
        <p role="status" className="ds-card p-5 text-sm">O diretório abre para membros com cadastro ativo. Fale com a equipe para regularizar o seu cadastro.</p>
      ) : lista.length === 0 ? (
        <div className="ds-card p-6">
          <Factory className="size-8 text-[var(--bd-acao)]" aria-hidden />
          <p className="mt-3 text-lg font-bold">{filtrando ? "Nenhum fornecedor com esses filtros ainda." : "Os primeiros fornecedores do Canindé estão entrando."}</p>
          <p className="mt-1 text-muted-foreground">A equipe aprova cada cadastro antes de mostrar aqui. Conhece um fornecedor bom? Mande o endereço {`${brandByCode("BRAS_DIGITAL").baseUrl.replace(/^https?:\/\//, "")}/fornecer`} para ele ou indique em <Link href="/meu-bras/club" className="font-semibold text-link underline">Indique e ganhe</Link>.</p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {lista.map((f) => {
            const wa = brasWhatsappUrl(`Olá! Sou da ${member!.companyName}, membro do Brás Digital Club. Quero uma cotação com ${f.name} (${SUPPLIER_TYPE_LABEL[f.supplierType]}, ${POLO_LABEL[f.polo]}).`);
            return (
              <li key={f.id} className="ds-card flex flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold">{f.name}</h2>
                  <span className="ds-pill">{SUPPLIER_TYPE_LABEL[f.supplierType]}</span>
                  <span className="ds-pill ds-pill--mute inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{POLO_LABEL[f.polo]}</span>
                </div>
                <p className="mt-2 text-sm">{f.categories.join(" · ")}</p>
                {f.description ? <p className="mt-2 text-sm text-muted-foreground">{f.description}</p> : null}
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">Pedido mínimo</dt><dd>{f.minBoxes ? `${f.minBoxes} caixa(s)` : "a combinar"}</dd>
                  <dt className="text-muted-foreground">Pagamento</dt><dd>{f.paymentMethods.length ? f.paymentMethods.join(", ") : "a combinar"}</dd>
                  {f.prepDays ? <><dt className="text-muted-foreground">Separação</dt><dd>{f.prepDays} dia(s)</dd></> : null}
                  <dt className="text-muted-foreground">À venda no Club</dt><dd className="inline-flex items-center gap-1"><Package className="size-3.5" aria-hidden />{f.productsOnSale} produto(s)</dd>
                </dl>
                <div className="mt-auto pt-4">
                  {wa ? <a href={wa} target="_blank" rel="noreferrer" className="bd-btn bd-btn--primario w-full"><MessageCircle className="size-5" aria-hidden />Pedir cotação pela equipe</a> : <p className="text-sm text-muted-foreground">Peça a cotação pelo Suporte.</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
