import type { MapaEcossistema, NivelSaude } from "@/lib/domain/ecossistema/mapa";
import { raioDoNo } from "@/lib/domain/ecossistema/mapa";

/** Cor do anel de saúde (sempre acompanhada do motivo em texto fora do desenho). */
export const COR_SAUDE: Record<NivelSaude, string> = { BEM: "var(--success, #1f7a3d)", OBSERVAR: "var(--warning, #9a5b00)", ATENCAO: "var(--danger, #b42323)", PREPARACAO: "var(--muted-foreground, #8a93a8)" };
export const ROTULO_SAUDE: Record<NivelSaude, string> = { BEM: "Bem", OBSERVAR: "Observar", ATENCAO: "Atenção", PREPARACAO: "Em preparação" };

/**
 * Constelação do ecossistema (D175): holding no centro, marcas em volta na ordem do foco, linhas para clientes em comum.
 * SVG feito no servidor; cada nó é um link com nome. A tabela da página é a alternativa em texto.
 */
export function MapaConstelacao({ mapa, destaque }: { mapa: MapaEcossistema; destaque: string | null }) {
  const W = 760, H = 460, cx = W / 2, cy = H / 2, R = 175;
  const maior = Math.max(1, ...mapa.marcas.map((m) => m.clientes));
  const pos = new Map(mapa.marcas.map((m, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / mapa.marcas.length;
    return [m.code, { x: cx + R * 1.55 * Math.cos(ang), y: cy + R * Math.sin(ang) }];
  }));
  const maiorPar = Math.max(1, ...mapa.pares.map((p) => p.n));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mapa-constelacao h-auto w-full" role="group" aria-label="Constelação das marcas do Grupo NextLevel">
      <style>{`
        .mapa-constelacao text { font-family: inherit; fill: var(--foreground); }
        .mapa-constelacao .sub { fill: var(--muted-foreground); font-size: 12px; }
        .mapa-constelacao a:focus-visible circle.anel { stroke-width: 6; }
        .mapa-constelacao .pulso { transform-box: fill-box; transform-origin: center; animation: mapa-pulso 2.4s ease-in-out infinite; }
        @keyframes mapa-pulso { 0%, 100% { opacity: .9; transform: scale(1); } 50% { opacity: .25; transform: scale(1.18); } }
        @media (prefers-reduced-motion: reduce) { .mapa-constelacao .pulso { animation: none; } }
      `}</style>
      {mapa.marcas.map((m) => { const p = pos.get(m.code)!; return <line key={`h-${m.code}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth={1.5} strokeDasharray={m.noAr ? undefined : "4 5"} />; })}
      {mapa.pares.map((par) => {
        const a = pos.get(par.a), b = pos.get(par.b);
        if (!a || !b) return null;
        return (
          <g key={`${par.a}-${par.b}`}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--brand-primary, #3f65ff)" strokeOpacity={0.55} strokeWidth={2 + (par.n / maiorPar) * 6} />
            <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 6} textAnchor="middle" className="sub">{par.n} em comum</text>
          </g>
        );
      })}
      <g>
        <circle cx={cx} cy={cy} r={46} fill="var(--surface)" stroke="var(--foreground)" strokeWidth={2} />
        <text x={cx} y={cy - 2} textAnchor="middle" fontWeight={700} fontSize={15}>NextLevel</text>
        <text x={cx} y={cy + 16} textAnchor="middle" className="sub">holding</text>
      </g>
      {mapa.marcas.map((m) => {
        const p = pos.get(m.code)!;
        const r = raioDoNo(m.clientes, maior);
        const apagado = destaque && destaque !== m.code;
        return (
          <a key={m.code} href={m.href} aria-label={`${m.nome}: ${m.clientes} ${m.rotuloClientes}, saúde ${ROTULO_SAUDE[m.saude.nivel]}. ${m.saude.motivo}`} style={{ opacity: apagado ? 0.35 : 1 }}>
            {m.saude.nivel === "ATENCAO" ? <circle className="pulso" cx={p.x} cy={p.y} r={r + 9} fill="none" stroke={COR_SAUDE.ATENCAO} strokeWidth={3} /> : null}
            <circle className="anel" cx={p.x} cy={p.y} r={r + 5} fill="none" stroke={COR_SAUDE[m.saude.nivel]} strokeWidth={4} />
            <circle cx={p.x} cy={p.y} r={r} fill={m.noAr ? m.cor : "var(--surface)"} stroke={m.cor} strokeWidth={2} />
            <text x={p.x} y={p.y + 6} textAnchor="middle" fontWeight={700} fontSize={18} style={{ fill: m.noAr ? "#fff" : "var(--muted-foreground)" }}>{m.noAr ? m.clientes : "—"}</text>
            <text x={p.x} y={p.y + r + 24} textAnchor="middle" fontWeight={600} fontSize={14}>{m.nome}</text>
            <text x={p.x} y={p.y + r + 40} textAnchor="middle" className="sub">{m.noAr ? m.rotuloClientes : "em breve"}</text>
          </a>
        );
      })}
    </svg>
  );
}
