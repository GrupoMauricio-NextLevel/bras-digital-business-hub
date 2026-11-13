"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { escolherMarcaMasterAction } from "@/app/actions/master-marca";
import { PRODUCT_CONTEXTS } from "@/lib/product-context";
import { NEGOCIOS, estadoDoNegocio } from "@/lib/negocios";
import type { MarcaMaster } from "@/lib/master-marca";



/**
 * Seletor de negócios do Master (D209): uma pílula na faixa do topo ("Negócio: Commerce") que abre os negócios do
 * grupo em cartões. Aberto = dá para trocar; Pausado = trancado no Master (MASTER_MARCAS_ATIVAS); Em breve = sem código.
 * Substitui o "NextLevel / …" do menu lateral e a faixa "Vendo:".
 */
export function SeletorNegocios({ atual, ativas }: { atual: MarcaMaster | null; ativas: MarcaMaster[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const escolher = (code: string) => start(async () => {
    const r = await escolherMarcaMasterAction(code);
    if (!r.ok) toast.error(r.error ?? "Não foi possível trocar o negócio."); else router.refresh();
  });
  const varios = ativas.length > 1;
  const aberto = atual ?? (varios ? null : ativas[0] ?? null);
  const atualN = NEGOCIOS.find((n) => n.code === aberto);
  const rotulo = atualN ? atualN.nome : "Todos os negócios";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="ds-negocio" aria-label={`Negócio aberto: ${rotulo}. Trocar de negócio`}>
          <span className="ds-negocio-sigla" style={atualN ? { background: PRODUCT_CONTEXTS[atualN.ctx].accent, color: PRODUCT_CONTEXTS[atualN.ctx].accentContrast } : undefined} aria-hidden>{atualN ? atualN.sigla : <LayoutGrid className="size-3.5" />}</span>
          <span className="ds-negocio-txt"><small>Negócio</small><b>{rotulo}</b></span>
          <ChevronDown className="size-4 opacity-80" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="ds-negocios">
        <div className="ds-negocios-topo"><b>Seus negócios</b><span>Escolha qual negócio o Master mostra agora.</span></div>
        <ul className="ds-negocios-grade">
          {varios ? (
            <li><button type="button" disabled={pending} onClick={() => escolher("todas")} aria-current={!atual ? "true" : undefined} className="ds-negocio-card">
              <span className="ds-negocio-sigla" aria-hidden><LayoutGrid className="size-4" /></span>
              <span className="min-w-0 flex-1"><b>Todos</b><small>Visão do grupo</small></span>{!atual ? <Check className="size-4 text-[var(--ds-link)]" aria-hidden /> : null}
            </button></li>
          ) : null}
          {NEGOCIOS.map((n) => {
            const c = PRODUCT_CONTEXTS[n.ctx];
            const e = estadoDoNegocio(n.code, ativas);
            const ativa = e === "aberto";
            const corrente = n.code === aberto;
            const estado = corrente ? "Aberto agora" : { aberto: "Disponível", proximo: "Próximo", pausado: "Pausado", "em-breve": "Em breve" }[e];
            const corpo = <>
              <span className="ds-negocio-sigla" style={{ background: c.accent, color: c.accentContrast }} aria-hidden>{n.sigla}</span>
              <span className="min-w-0 flex-1"><b>{n.nome}</b><small>{n.descritor}</small></span>
              {corrente ? <Check className="size-4 text-[var(--ds-link)]" aria-hidden /> : <em data-estado={ativa ? "ok" : e}>{estado}</em>}
            </>;
            return <li key={n.code}>{ativa && !corrente
              ? <button type="button" disabled={pending} onClick={() => escolher(n.code)} className="ds-negocio-card">{corpo}</button>
              : <div className="ds-negocio-card" data-estado={e} aria-current={corrente ? "true" : undefined} aria-disabled={!corrente || undefined} title={!ativa ? { proximo: "Próximo negócio a entrar no Master, depois da Commerce.", pausado: "Trancado no Master. Para abrir, a equipe técnica inclui a marca em MASTER_MARCAS_ATIVAS.", "em-breve": "Ainda sem sistema desenvolvido.", aberto: undefined }[e] : undefined}>{corpo}</div>}</li>;
          })}
        </ul>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
