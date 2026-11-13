import Link from "next/link";
import { getDb } from "@/db/client";
import { blackAgora } from "@/lib/domain/campanha-black";
import { ContagemRegressiva } from "./contagem-regressiva";
import "./black.css";

/**
 * Faixa da Black NextLevel (D229) no topo dos sites públicos e dos painéis. Some sozinha fora da campanha.
 * Cada lugar tem a sua chamada e o seu destino; a contagem é a mesma em todos (fim real da configuração do Master).
 */
type Lugar = "publico" | "grupo" | "lojista" | "master" | "parceiro";
const DESTINO: Record<Lugar, { texto: string; href: string; botao: string }> = {
  publico: { texto: "", href: "/planos", botao: "Garantir meu preço" },
  grupo: { texto: "Black NextLevel Commerce: anual com 2 meses grátis e taxa zero da plataforma", href: "", botao: "Ver a Black" },
  lojista: { texto: "Mude para o anual na Black: 2 meses grátis e preço travado enquanto for cliente", href: "/merchant/finance", botao: "Ver meu plano" },
  master: { texto: "Black no ar: anual com 2 meses grátis; o preço novo entra sozinho no fim", href: "/master/black", botao: "Configurar" },
  parceiro: { texto: "Seus indicados ganham anual com 2 meses grátis e preço travado: hora de indicar", href: "/partner/links", botao: "Pegar meu link" },
};

export async function FaixaBlack({ lugar, hrefGrupo }: { lugar: Lugar; hrefGrupo?: string }) {
  const b = await blackAgora(await getDb());
  if (!b.ativa) return null;
  const d = DESTINO[lugar];
  const texto = d.texto || b.chamada;
  const href = lugar === "grupo" ? hrefGrupo ?? "/" : d.href;
  return (
    <aside className={`bk-faixa bk-faixa--${lugar === "publico" || lugar === "grupo" ? "site" : "painel"}`} aria-label="Black Friday NextLevel">
      <span className="bk-selo"><span aria-hidden className="bk-raio" />BLACK FRIDAY<b>NEXTLEVEL</b></span>
      <span className="bk-faixa-texto">{b.prorrogada ? "Prorrogada! " : ""}{texto}</span>
      <ContagemRegressiva fim={b.fim} restanteMs={b.restanteMs} tamanho="sm" />
      <Link href={href} className="bk-cta">{d.botao}</Link>
    </aside>
  );
}
