import Link from "next/link";
import { CheckCircle2, Globe, Inbox, LayoutDashboard, PlugZap, ShoppingBag } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { escopoDaAgencia } from "@/lib/agencias/acesso";
import { solucoesDaAgencia } from "@/lib/agencias/solucoes";
import { Abrir, Conectar } from "./solucoes-cliente";
import { AbrirIndique, AtivarIndique } from "@/components/agencia/gestao-cliente";
import { Gift } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Soluções NextLevel" };

const card = "ds-card p-5 sm:p-6";
const Ativo = ({ on }: { on: boolean }) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${on ? "bg-success-soft text-success" : "bg-surface-muted text-muted-foreground"}`}>{on ? "Ativo" : "Disponível"}</span>;

/** Soluções NextLevel (D323): a janela de conexão da agência com o NextLevel Business, sem nada recriado. */
export default async function Solucoes() {
  const session = await requireRole("AGENCY");
  const db = await getDb();
  const { membro } = await escopoDaAgencia(db, session.actor);
  if (membro.funcao !== "ADMIN") return <><PageHeader title="Soluções NextLevel" /><EmptyState icon={PlugZap} title="As soluções são do administrador da agência" description="Fale com o administrador se precisar de site, loja virtual ou outra solução." /></>;
  const s = await solucoesDaAgencia(db, session.actor);
  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      <PageHeader eyebrow="Conexão com a NextLevel" title="Soluções NextLevel" description="Site, loja virtual e o gerenciador do negócio para a própria agência, com um clique. É o NextLevel Business de sempre, ligado ao seu login." />
      <section className={card} aria-labelledby="sl-ind">
        <h2 id="sl-ind" className="mb-1 flex items-center gap-2 text-base font-semibold"><Gift className="size-5 text-[var(--ds-link)]" aria-hidden />Indique e ganhe</h2>
        {s.indique.ativo ? (
          <><p className="text-sm text-muted-foreground">A agência está no programa de parceiros da NextLevel. Código: <b className="text-foreground">{s.indique.codigo}</b>. Links, indicações e comissões ficam no painel de parceiro.</p>{s.indique.euLigado ? <div className="mt-3"><AbrirIndique /></div> : <p className="mt-2 text-sm">Ativado por outra pessoa da agência: ligue o perfil em <Link href="/account/marcas" className="font-semibold text-link underline underline-offset-4">Suas marcas</Link>.</p>}</>
        ) : s.temDocumento ? <><p className="mb-3 text-sm text-muted-foreground">Indique a NextLevel para outras empresas e acompanhe as comissões, com as mesmas regras do programa de parceiros.</p><AtivarIndique emailSugerido={s.emailParceiro} /></> : <p className="text-sm">Preencha o CNPJ da agência em <Link href="/agencia/equipe#dados-agencia" className="font-semibold text-link underline underline-offset-4">Equipe, em Dados da agência</Link> para ativar.</p>}
      </section>
      {!s.conectada ? (
        <section className={card} aria-labelledby="sl-con">
          <h2 id="sl-con" className="mb-1 text-base font-semibold">Conectar a agência ao NextLevel Business</h2>
          <p className="mb-4 text-sm text-muted-foreground">Criamos a conta do negócio da agência com os dados que você já preencheu (nome e CNPJ). Depois é só abrir cada solução daqui, sem novo login.</p>
          {s.temDocumento ? <Conectar emailSugerido={s.emailSugerido} business={s.business} /> : <p role="alert" className="rounded-xl bg-warning-soft p-3 text-sm">Antes, preencha o CNPJ ou CPF da agência em <Link href="/agencia/equipe#dados-agencia" className="font-semibold text-link underline underline-offset-4">Equipe, em Dados da agência</Link>.</p>}
        </section>
      ) : (
        <>
          <section className={card} aria-labelledby="sl-ok">
            <h2 id="sl-ok" className="flex flex-wrap items-center gap-2 text-base font-semibold"><CheckCircle2 className="size-5 text-success" aria-hidden />Conectada: {s.negocio.nome}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{s.euConectado ? "A conta do negócio está ligada ao seu login. Os botões abaixo abrem cada solução direto, sem senha nova. Para voltar, use Suas marcas no menu da conta." : "A conta do negócio foi conectada por outra pessoa da agência. Para abrir daqui, ligue o perfil em Suas marcas."}</p>
            {s.euConectado ? <div className="mt-3"><Abrir destino="painel" variant="primary">Abrir o painel do negócio</Abrir></div> : <Link href="/account/marcas" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4">Abrir Suas marcas</Link>}
          </section>
          <section aria-label="Soluções" className="grid gap-4 md:grid-cols-3">
            <article className={card}><div className="mb-2 flex items-center justify-between"><Globe className="size-5 text-[var(--ds-link)]" aria-hidden /><Ativo on={s.negocio.site} /></div><h3 className="font-semibold">Site</h3><p className="mt-1 text-sm text-muted-foreground">Páginas da agência, serviços e formulário de contato.</p>{s.euConectado ? <div className="mt-3"><Abrir destino={s.negocio.site ? "site" : "plano"}>{s.negocio.site ? "Editar o site" : "Ativar o site"}</Abrir></div> : null}</article>
            <article className={card}><div className="mb-2 flex items-center justify-between"><ShoppingBag className="size-5 text-[var(--ds-link)]" aria-hidden /><Ativo on={s.negocio.loja} /></div><h3 className="font-semibold">Loja virtual</h3><p className="mt-1 text-sm text-muted-foreground">Catálogo, carrinho e checkout com Pix e cartão.</p>{s.euConectado ? <div className="mt-3"><Abrir destino={s.negocio.loja ? "loja" : "plano"}>{s.negocio.loja ? "Abrir a loja" : "Ligar a loja virtual"}</Abrir></div> : null}</article>
            <article className={card}><div className="mb-2 flex items-center justify-between"><Inbox className="size-5 text-[var(--ds-link)]" aria-hidden /><Ativo on={s.negocio.business} /></div><h3 className="font-semibold">Contatos e orçamentos</h3><p className="mt-1 text-sm text-muted-foreground">Pedidos que chegam pelo site do negócio, com a origem.</p>{s.euConectado ? <div className="mt-3"><Abrir destino="contatos">Abrir contatos</Abrir></div> : null}</article>
          </section>
          <section className={card} aria-labelledby="sl-mais">
            <h2 id="sl-mais" className="mb-3 flex items-center gap-2 text-base font-semibold"><LayoutDashboard className="size-5 text-[var(--ds-link)]" aria-hidden />Mais soluções do NextLevel Business</h2>
            <ul className="divide-y divide-border text-sm">{s.negocio.extras.map((x) => <li key={x.chave} className="flex min-h-11 items-center justify-between gap-2 py-2"><span>{x.nome}</span><Ativo on={x.ativo} /></li>)}</ul>
            {s.euConectado ? <div className="mt-3"><Abrir destino="plano">Ver plano e ativar soluções</Abrir></div> : null}
          </section>
        </>
      )}
    </div>
  );
}
