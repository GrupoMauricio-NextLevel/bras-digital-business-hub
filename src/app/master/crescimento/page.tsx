import Link from "next/link";
import { ArrowRight, BadgePercent, Bot, Globe, LayoutTemplate, UsersRound } from "lucide-react";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { getDb } from "@/db/client";
import { getNextLevelMp } from "@/lib/domain/nextlevel-billing";
import { getIaConfig } from "@/lib/domain/ia";
import { crescimentoAgora } from "@/lib/domain/master-agora";
import { PrecisaDeVoce } from "@/components/app/precisa-de-voce";

export const dynamic = "force-dynamic";

const ITENS = [
  { icon: UsersRound, titulo: "Parceiros e indicações", texto: "Quem indica lojistas, comissões, saques e antifraude.", href: "/master/partners" },
  { icon: BadgePercent, titulo: "Ofertas e preços", texto: "Oferta de entrada (dias grátis, 1º mês), preços dos planos e regras de comissão.", href: "/master/financeiro/ofertas" },
  { icon: Bot, titulo: "Maurício vendedor", texto: "A IA que atende a home 24 h: chave, limites e o que ela pode fazer em cada plano.", href: "/master/ia/ajustes" },
  { icon: LayoutTemplate, titulo: "Temas e templates", texto: "A vitrine de temas que o lojista escolhe e as demonstrações públicas.", href: "/master/templates" },
  { icon: Globe, titulo: "Página pública", texto: "A home da Commerce que o visitante vê (abre em outra aba).", href: "/", externo: true },
] as const;

/** Crescimento (D204): o que ligar para vender mais, num lugar só. */
export default async function CrescimentoPage() {
  await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [mp, ia] = await Promise.all([getNextLevelMp(db), getIaConfig(db)]);
  // D215: o que falta ligar para vender (só "ligado/desligado"; nenhum valor de chave sai daqui).
  const itens = crescimentoAgora({ mp, emailLigado: !!process.env.RESEND_API_KEY?.trim() && !!process.env.EMAIL_FROM?.trim(), iaComChave: !!ia.chaveEnc, iaUsoReal: ia.usoReal });
  return (
    <>
      <PageHeader eyebrow="NextLevel Commerce" title="Crescimento" description="O que você liga e ajusta para trazer mais lojistas: parceiros, ofertas, o vendedor 24 h e a vitrine de temas." />
      <PrecisaDeVoce itens={itens} vazio="Tudo ligado: cobrança, e-mails e IA." descricao="O que ainda falta ligar para a máquina de vendas rodar sozinha." />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ITENS.map((i) => (
          <li key={i.href}>
            <Link href={i.href} target={"externo" in i ? "_blank" : undefined} className="ds-card flex h-full flex-col gap-2 hover:border-primary">
              <i.icon className="size-6 text-primary" aria-hidden />
              <b className="text-lg">{i.titulo}</b>
              <span className="text-sm text-muted-foreground">{i.texto}</span>
              <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-bold text-[var(--ds-link)]">Abrir <ArrowRight className="size-4" aria-hidden /></span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
