"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Share2 } from "lucide-react";
import type { Jogo } from "@/lib/domain/placar";
import type { DegrauPlacar } from "@/lib/marcas/placar-seed";

/**
 * Placar da goleada (D230): placar de estádio com "ao vivo", gols contados na tela, lances que vencemos em destaque e os
 * deles discretos. Só recebe jogos que são vitória (o servidor filtra). Sem animação com prefers-reduced-motion.
 */
const DEGRAUS: { key: DegrauPlacar; nome: string }[] = [{ key: "entrada", nome: "Plano de entrada" }, { key: "intermediario", nome: "Intermediário" }, { key: "avancado", nome: "Avançado" }];

export function PlacarGoleada({ jogos, atualizadoEm, cta, rotuloCta = "Quero jogar no time que vence" }: { jogos: Jogo[]; atualizadoEm: string; cta: string; rotuloCta?: string }) {
  const [degrau, setDegrau] = React.useState<DegrauPlacar>("entrada");
  const doDegrau = jogos.filter((j) => j.degrau === degrau);
  const [rival, setRival] = React.useState("selecao");
  const atual = doDegrau.find((j) => j.rivalKey === rival) ?? doDegrau[0];
  const ref = React.useRef<HTMLDivElement>(null);
  const [visto, setVisto] = React.useState(false);
  const [conta, setConta] = React.useState({ chave: "", n: 0 });
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setVisto(true); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(el); return () => io.disconnect();
  }, []);
  const chave = atual ? `${atual.rivalKey}:${atual.degrau}` : "";
  const final = atual?.nextlevel ?? 0;
  React.useEffect(() => {
    if (!visto || !chave) return;
    const reduzido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let i = reduzido ? final - 1 : -1;
    const id = setInterval(() => { i += 1; setConta({ chave, n: i }); if (i >= final) clearInterval(id); }, reduzido ? 1 : 160);
    return () => clearInterval(id);
  }, [visto, chave, final]);
  // Antes de aparecer na tela (ou sem o observador), mostra o placar pronto; ao aparecer, conta os gols.
  const n = !visto ? final : conta.chave === chave ? conta.n : 0;
  if (!atual) return null;
  const gols = atual.lances.filter((l) => l.quem === "nextlevel");
  const deles = atual.lances.filter((l) => l.quem === "rival");
  const artilheiro = gols.find((l) => l.key === "taxa") ?? gols[0];
  const quando = new Date(atualizadoEm).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });
  const compartilhar = async () => {
    const texto = `NextLevel ${atual.nextlevel} × ${atual.adversario} ${atual.rival} (${DEGRAUS.find((d) => d.key === degrau)!.nome}). Taxa zero da plataforma e mais benefícios.`;
    try { if (navigator.share) await navigator.share({ title: "O Clássico do E-commerce", text: texto, url: window.location.href }); else await navigator.clipboard.writeText(`${texto} ${window.location.href}`); } catch { /* cancelado */ }
  };
  return (
    <div ref={ref} className="pl-placar">
      <div className="pl-abas" role="tablist" aria-label="Plano do jogo">
        {DEGRAUS.map((d) => <button key={d.key} role="tab" aria-selected={degrau === d.key} onClick={() => { setDegrau(d.key); setRival("selecao"); }} className="pl-aba">{d.nome}</button>)}
      </div>
      <div className="pl-rivais" role="group" aria-label="Adversário">
        {doDegrau.map((j) => <button key={j.rivalKey} type="button" aria-pressed={j.rivalKey === atual.rivalKey} onClick={() => setRival(j.rivalKey)} className="pl-chip">{j.rivalKey === "selecao" ? "Seleção dos concorrentes" : j.rival}</button>)}
      </div>

      <div className="pl-telao" aria-live="polite">
        <p className="pl-ao-vivo"><span aria-hidden className="pl-ponto" />AO VIVO · dados de {quando}</p>
        <div className="pl-linha">
          <div className="pl-time pl-time--nos"><span className="pl-nome">NEXTLEVEL</span><span className="pl-plano">Commerce</span></div>
          <div className="pl-gols" aria-label={`NextLevel ${atual.nextlevel} a ${atual.adversario} ${atual.rival}`}>
            <b className="pl-num pl-num--nos">{n}</b><span aria-hidden className="pl-x">×</span><b className="pl-num">{atual.adversario}</b>
          </div>
          <div className="pl-time"><span className="pl-nome">{atual.rivalKey === "selecao" ? "SELEÇÃO" : atual.rival.toUpperCase()}</span><span className="pl-plano">{atual.rivalKey === "selecao" ? "dos concorrentes" : atual.plano}</span></div>
        </div>
        <p className="pl-veredito">{atual.goleada ? "GOLEADA! Show de bola da NextLevel" : "Vitória da NextLevel"}</p>
      </div>

      <div className="pl-corpo">
        <div>
          <p className="pl-titulo">Os gols da NextLevel</p>
          <ol className="pl-lances">
            {gols.map((l) => (
              <li key={l.key} className="pl-gol">
                <span className="pl-min">{l.minuto}&apos;</span>
                <span className="pl-lance"><b>{l.lance}</b><span>NextLevel <strong>{l.nosso}</strong> × {l.rival} {l.deles}</span></span>
                <span className="pl-tag">GOL</span>
              </li>
            ))}
          </ol>
          {deles.length ? <p className="pl-deles">Gol de honra deles: {deles.map((l) => `${l.minuto}' ${l.lance.toLowerCase()} (${l.rival}: ${l.deles})`).join(" · ")}</p> : null}
          <p className="pl-nota">Empates e itens que o concorrente não divulga não valem gol. Na Seleção, o gol conta contra o melhor do grupo em cada lance; o texto mostra o ponto mais fraco de um deles, com o nome. Dados dos sites oficiais; veja o comparativo.</p>
        </div>
        <aside className="pl-melhores">
          {artilheiro ? <p><span>Artilheiro do jogo</span><b>{artilheiro.lance}</b></p> : null}
          <p><span>Placar</span><b>{atual.nextlevel} gols a {atual.adversario}</b></p>
          <Link href={cta} className="pl-cta">{rotuloCta} <ArrowRight className="size-4" aria-hidden /></Link>
          <button type="button" onClick={compartilhar} className="pl-share"><Share2 className="size-4" aria-hidden />Compartilhar o placar</button>
        </aside>
      </div>
    </div>
  );
}
