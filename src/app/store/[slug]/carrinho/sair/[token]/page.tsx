import { SairDosLembretes } from "./sair";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false }, title: "Parar os lembretes" };

/** Sair dos lembretes de carrinho (D186). Pede um clique: leitores automáticos de links não descadastram ninguém. */
export default async function SairPage({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = await params;
  return <SairDosLembretes slug={slug} token={token} />;
}
