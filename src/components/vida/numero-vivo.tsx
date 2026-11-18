import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { FamiliaVida } from "@/components/vida/cores";

/** Ícones 3D das famílias (imagens do dono, D332), em `public/paineis/v1/`. Sem arquivo, fica o ícone de traço. */
const ICONE_3D: Partial<Record<FamiliaVida, string>> = {
  dinheiro: "/paineis/v1/pv-icone-dinheiro.webp", pedidos: "/paineis/v1/pv-icone-pedidos.webp", clientes: "/paineis/v1/pv-icone-clientes.webp",
  visitas: "/paineis/v1/pv-icone-visitas.webp", crescimento: "/paineis/v1/pv-icone-crescimento.webp", festa: "/paineis/v1/pv-icone-festa.webp",
};

/** Mini gráfico do cartão (SVG próprio, decorativo: o número e a variação já dizem tudo). */
function Mini({ dados }: { dados: number[] }) {
  if (dados.length < 2) return null;
  const w = 120, h = 34, max = Math.max(...dados), min = Math.min(...dados), span = max - min || 1;
  const pts = dados.map((v, i) => `${((i / (dados.length - 1)) * w).toFixed(1)},${(h - 3 - ((v - min) / span) * (h - 6)).toFixed(1)}`).join(" ");
  return <svg viewBox={`0 0 ${w} ${h}`} className="vida-num__mini h-7 w-20 shrink-0 sm:w-24" aria-hidden preserveAspectRatio="none"><polyline points={pts} pathLength={1} className="vida-linha" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Variação com seta, sinal e palavra (a cor nunca é o único sinal). */
export function Variacao({ valor, base }: { valor: number | null | undefined; base?: string }) {
  if (valor === null || valor === undefined) return null;
  const Icon = valor > 0 ? ArrowUpRight : valor < 0 ? ArrowDownRight : Minus;
  const txt = `${valor > 0 ? "+" : valor < 0 ? "−" : ""}${Math.abs(valor).toFixed(1).replace(".", ",")}%`;
  return <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${valor > 0 ? "vida-sobe" : valor < 0 ? "vida-desce" : ""}`}><Icon className="size-3.5" aria-hidden />{txt}<span className="sr-only">{valor > 0 ? " de alta" : valor < 0 ? " de queda" : " estável"}</span>{base ? <span className="ml-1 font-normal text-muted-foreground">{base}</span> : null}</span>;
}

/**
 * Cartão de número vivo (D331): família de cor por assunto, valor grande, variação e mini gráfico.
 * `titulo` vai no aria-label quando o valor é compacto ("R$ 48,8 mil" → valor completo).
 */
export function NumeroVivo({ familia, icone: Icone, rotulo, valor, valorCompleto, variacao, base, nota, serie = [], href, i = 0, traco = false }: {
  familia: FamiliaVida; icone: LucideIcon; rotulo: string; valor: string; valorCompleto?: string;
  variacao?: number | null; base?: string; nota?: React.ReactNode; serie?: number[]; href?: string; i?: number;
  /** Ícone de traço em vez do 3D (quando a mesma família se repete na tela). */
  traco?: boolean;
}) {
  const corpo = <>
    <span className="flex items-center gap-2">{ICONE_3D[familia] && !traco ? <Image src={ICONE_3D[familia]!} alt="" width={44} height={44} className="vida-num__icone3d" /> : <span className="vida-num__icone"><Icone className="size-4" aria-hidden /></span>}<span className="vida-num__rotulo truncate">{rotulo}</span></span>
    <span className="vida-num__valor mt-1 min-w-0" title={valorCompleto}>{valor}{valorCompleto && valorCompleto !== valor ? <span className="sr-only"> ({valorCompleto})</span> : null}</span>
    <span className="flex min-h-8 items-end justify-between gap-2 text-xs text-muted-foreground"><span className="flex min-w-0 flex-wrap items-center gap-x-2"><Variacao valor={variacao} base={base} />{nota ? <span>{nota}</span> : null}</span><Mini dados={serie} /></span>
  </>;
  const style = { "--i": i } as React.CSSProperties;
  return href ? <Link href={href} data-familia={familia} className="vida-num ds-enter" style={style}>{corpo}</Link> : <div data-familia={familia} className="vida-num ds-enter" style={style}>{corpo}</div>;
}
