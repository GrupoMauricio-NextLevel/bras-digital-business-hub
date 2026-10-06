// Gera preview.html (apresentação local) e ferramentas/prancha.html (base do comparativo.png).
import { writeFileSync, mkdirSync } from "node:fs";
import { sistema, STEPS, NAVY, OFFWHITE } from "./sistema.mjs";
import { oklchStr } from "./cores.mjs";

const OUT = process.argv[2];
const S = sistema();
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

const ICON = {
  ok: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  alerta: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3l8 14H2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 8v4M10 14.6v.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  erro: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  info: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 9v5M10 6v.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};

const logo = (m, variante, cls = "") => m.oficial
  ? `<img class="lg so-claro ${cls}" src="logos/${m.id}/claro/${variante}.svg" alt="${esc(m.nome)}"><img class="lg so-escuro ${cls}" src="logos/${m.id}/escuro/${variante}.svg" alt="${esc(m.nome)}">`
  : `<span class="sem-logo ${cls}"><b>${esc(m.nome)}</b><small>Proposta · sem logo oficial</small></span>`;

const BASE_CSS = `
*{box-sizing:border-box}
html{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;background:var(--canvas);color:var(--text-primary)}
body{margin:0;line-height:1.5}
.so-escuro{display:none!important}
[data-theme="dark"] .so-claro{display:none!important}
[data-theme="dark"] .so-escuro{display:inline-block!important}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .so-claro{display:none!important}:root:not([data-theme="light"]) .so-escuro{display:inline-block!important}}
a{color:var(--brand-text)}
:focus-visible{outline:3px solid var(--focus-ring);outline-offset:2px}
.sem-logo{display:inline-flex;flex-direction:column;line-height:1.15}
.sem-logo b{font-size:1.05rem;letter-spacing:-.01em}
.sem-logo small{font-size:.72rem;color:var(--text-secondary);font-weight:600}
`;

// ------------------------------- preview.html -------------------------------
const cardPaleta = (m) => `
<article class="pal" data-brand="${m.id}">
  <header class="pal-h">
    <div class="pal-logo">${m.oficial ? logo(m, "monograma", "mono") : '<span class="pal-sem">sem logo</span>'}</div>
    <h3>${esc(m.nome)}</h3><p>${esc(m.papel.replace(" (planejada)", ""))}</p>
  </header>
  <span class="status ${m.oficial ? "of" : "pl"}">${m.oficial ? "Oficial" : "Planejada · sem logo oficial"}</span>
  <div class="sw" style="background:${m.assinatura}"><span class="sw-n">${esc(m.cor)}</span></div>
  <dl class="cods"><dt>Assinatura</dt><dd>${m.assinatura}</dd><dt>OKLCH</dt><dd>${oklchStr(m.assinatura).replace("oklch(", "").replace(")", "")}</dd></dl>
  <ol class="esc" aria-label="Escala ${esc(m.cor)}">${STEPS.map((s) => `<li style="background:${m.escala[s]}" title="${s} ${m.escala[s]}"><span>${s}</span></li>`).join("")}</ol>
  <div class="papeis">
    <button class="btn">Botão</button>
    <span class="chip-soft">Selecionado</span>
    <span class="ind" aria-hidden="true"></span>
    <a href="#" onclick="return false">Link da marca</a>
  </div>
</article>`;

const app = (m) => `
<section class="app" data-brand="${m.id}" aria-label="Interface de exemplo: ${esc(m.nome)}">
  <header class="app-top">
    <div class="app-marca">${logo(m, "compacta", "wm")}</div>
    <nav class="app-nav" aria-label="Exemplo"><a href="#" aria-current="page" onclick="return false">Início</a><a href="#" onclick="return false">Produtos</a><a href="#" onclick="return false">Ajuda</a></nav>
    <button class="btn btn-sm">Entrar</button>
  </header>
  <div class="app-body">
    <aside class="side" aria-label="Menu de exemplo">
      <a class="it ativo" href="#" onclick="return false">Painel</a><a class="it" href="#" onclick="return false">Pedidos</a><a class="it" href="#" onclick="return false">Catálogo</a><a class="it" href="#" onclick="return false">Financeiro</a>
    </aside>
    <div class="main">
      <div class="card">
        <p class="card-k">Vendas da semana</p><p class="card-v">R$ 12.480,00</p>
        <p class="sem-row"><span class="badge s-ok">${ICON.ok}Pago</span><span class="badge s-al">${ICON.alerta}Aguardando</span></p>
        <a href="#" onclick="return false">Ver relatório</a>
      </div>
      <div class="acoes"><button class="btn">Ação principal</button><button class="btn-2">Secundária</button><button class="btn foco">Foco</button></div>
      <div class="checkout">
        <p class="co-t">Pagamento</p>
        <label class="op sel"><span class="radio on" aria-hidden="true"></span>Pix <small>aprovação na hora</small></label>
        <label class="op"><span class="radio" aria-hidden="true"></span>Cartão <small>até 6x</small></label>
        <p class="tot"><span>Total</span><b>R$ 189,90</b></p>
        <button class="btn btn-full">Pagar com Pix</button>
      </div>
    </div>
  </div>
</section>`;

const preview = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cores NextLevel v2</title>
<link rel="stylesheet" href="tokens.css">
<style>${BASE_CSS}
.wrap{max-width:1360px;margin:0 auto;padding:24px 20px 64px}
.top{display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:18px;margin-bottom:28px}
.top h1{margin:0;font-size:clamp(1.4rem,2.6vw,2rem);letter-spacing:-.02em}
.top p{margin:4px 0 0;color:var(--text-secondary);max-width:70ch}
.tema{display:inline-flex;border:1px solid var(--border-strong);border-radius:999px;padding:3px;background:var(--surface)}
.tema button{border:0;background:transparent;color:var(--text-primary);font:inherit;font-weight:600;padding:6px 14px;border-radius:999px;cursor:pointer}
.tema button[aria-pressed="true"]{background:var(--text-primary);color:var(--canvas)}
h2{font-size:1.25rem;margin:40px 0 6px;letter-spacing:-.01em}
.lede{color:var(--text-secondary);margin:0 0 18px;max-width:80ch}
.paletas{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px}
@media (max-width:1180px){.paletas{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media (max-width:640px){.paletas{grid-template-columns:repeat(2,minmax(0,1fr))}}
.pal{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:10px;min-width:0}
.pal-h{display:flex;flex-direction:column;gap:6px;min-height:118px}
.pal-logo{height:40px;display:flex;align-items:center}
.pal-logo .mono{height:36px;width:auto}
.pal-sem{height:34px;padding:0 8px;border:1.5px dashed var(--border-strong);border-radius:8px;display:grid;place-items:center;color:var(--text-secondary);font-size:.7rem;font-weight:700}
.pal h3{margin:0;font-size:.92rem;line-height:1.2}
.pal p{margin:0;font-size:.72rem;color:var(--text-secondary);line-height:1.3}
.status{align-self:flex-start;font-size:.7rem;font-weight:700;padding:3px 8px;border-radius:999px;border:1px solid var(--border-strong)}
.status.pl{border-style:dashed}
.sw{height:72px;border-radius:12px;display:flex;align-items:flex-end;padding:8px}
.sw-n{font-size:.68rem;font-weight:700;background:var(--surface);color:var(--text-primary);padding:2px 7px;border-radius:999px;line-height:1.3}
.cods{margin:0;display:grid;gap:0;font-size:.7rem}
.cods dt{color:var(--text-secondary);font-weight:600}.cods dd{margin:0 0 4px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.72rem;overflow-wrap:anywhere}
.esc{display:grid;grid-template-columns:repeat(11,1fr);gap:0;padding:0;margin:0;list-style:none;border-radius:8px;overflow:hidden;height:22px}
.esc li span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.papeis{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:.82rem}
.btn{font:inherit;font-weight:700;border:0;border-radius:10px;padding:8px 14px;background:var(--brand-primary);color:var(--brand-on-primary);cursor:pointer}
.btn:hover{background:var(--brand-hover)}.btn:active{background:var(--brand-active)}
.btn.foco{outline:3px solid var(--focus-ring);outline-offset:2px}
.btn-sm{padding:6px 12px;font-size:.85rem}.btn-full{width:100%;padding:12px}
.btn-2{font:inherit;font-weight:700;border:1.5px solid var(--border-strong);border-radius:10px;padding:7px 14px;background:var(--surface);color:var(--text-primary);cursor:pointer}
.chip-soft{background:var(--brand-soft);color:var(--brand-on-soft);font-weight:700;padding:5px 10px;border-radius:999px}
.ind{width:4px;height:26px;border-radius:4px;background:var(--brand-indicator)}
.logos{display:grid;gap:12px}
.lrow{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:16px;display:grid;grid-template-columns:minmax(0,2.2fr) minmax(0,1.6fr) 90px 120px;gap:20px;align-items:center}
.lrow .lg{max-width:100%;height:auto}
.lrow .c1 .lg{width:min(320px,100%)}.lrow .c2 .lg{width:min(240px,100%)}.lrow .c3 .lg{width:72px}
.favs{display:flex;gap:10px;align-items:end;font-size:.7rem;color:var(--text-secondary)}
.favs img{display:block;image-rendering:auto}
.apps{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:16px}
.app{background:var(--canvas);border:1px solid var(--border);border-radius:18px;overflow:hidden}
.app-top{display:flex;gap:10px;align-items:center;padding:10px 12px;background:var(--surface);border-bottom:1px solid var(--border);min-width:0}
.app-top .btn-sm{flex:none}
.app-marca{flex:none;min-width:0}.app-marca .wm{height:26px;width:auto}.app-marca .sem-logo b{font-size:.95rem}
.app-nav{display:flex;gap:2px;margin-left:auto;font-size:.82rem;min-width:0;overflow:hidden}
.app-nav a{color:var(--text-primary);text-decoration:none;padding:5px 7px;border-radius:8px;font-weight:600;white-space:nowrap}
.app-nav a[aria-current]{box-shadow:inset 0 -3px 0 var(--brand-indicator)}
.app-body{display:grid;grid-template-columns:132px 1fr}
.side{background:var(--surface);border-right:1px solid var(--border);padding:10px 8px;display:flex;flex-direction:column;gap:2px}
.it{display:block;padding:7px 10px;border-radius:9px;color:var(--text-primary);text-decoration:none;font-size:.85rem;font-weight:600;position:relative}
.it.ativo{background:var(--brand-soft);color:var(--brand-on-soft)}
.it.ativo::before{content:"";position:absolute;left:-8px;top:6px;bottom:6px;width:4px;border-radius:0 4px 4px 0;background:var(--brand-indicator)}
.main{padding:14px;display:grid;gap:12px;min-width:0}
.card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:12px 14px}
.card p{margin:0}.card-k{font-size:.78rem;color:var(--text-secondary);font-weight:600}.card-v{font-size:1.4rem;font-weight:800;letter-spacing:-.02em}
.sem-row{display:flex;gap:6px;margin:6px 0!important}
.badge{display:inline-flex;align-items:center;gap:4px;font-size:.75rem;font-weight:700;padding:2px 8px 2px 6px;border-radius:999px}
.badge svg{width:14px;height:14px}
.s-ok{background:var(--success-soft);color:var(--on-success-soft)}.s-al{background:var(--warning-soft);color:var(--on-warning-soft)}
.acoes{display:flex;flex-wrap:wrap;gap:8px}
.checkout{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:12px 14px;display:grid;gap:8px}
.co-t{margin:0;font-weight:800}
.op{display:flex;align-items:center;gap:8px;border:1.5px solid var(--border-strong);border-radius:10px;padding:8px 10px;font-weight:600;font-size:.88rem}
.op small{color:var(--text-secondary);font-weight:500;margin-left:auto}
.op.sel{border-color:var(--brand-indicator);background:var(--brand-soft);color:var(--brand-on-soft)}
.op.sel small{color:var(--brand-on-soft)}
.radio{width:16px;height:16px;border-radius:50%;border:2px solid var(--border-strong);flex:none}
.radio.on{border:5px solid var(--brand-indicator)}
.tot{display:flex;justify-content:space-between;margin:2px 0}
.sems{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}
.al{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:12px;border:1px solid;font-size:.9rem}
.al svg{width:20px;height:20px;flex:none;margin-top:1px}
.al b{display:block}
.a-ok{background:var(--success-soft);color:var(--on-success-soft);border-color:var(--success-border)}
.a-al{background:var(--warning-soft);color:var(--on-warning-soft);border-color:var(--warning-border)}
.a-er{background:var(--danger-soft);color:var(--on-danger-soft);border-color:var(--danger-border)}
.a-in{background:var(--info-soft);color:var(--on-info-soft);border-color:var(--info-border)}
.nota{font-size:.85rem;color:var(--text-secondary);border-top:1px solid var(--border);margin-top:40px;padding-top:16px}
@media (max-width:760px){.lrow{grid-template-columns:1fr}.apps{grid-template-columns:1fr}.app-body{grid-template-columns:1fr}.side{flex-direction:row;overflow:auto;border-right:0;border-bottom:1px solid var(--border)}.it.ativo::before{display:none}.app-nav{display:none}}
</style>
<script>
(function(){try{var t=localStorage.getItem("nl-preview-tema");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})();
</script>
</head>
<body>
<div class="wrap">
  <header class="top">
    <div><h1>Cores do ecossistema NextLevel · v2</h1>
    <p>Sete marcas, uma família: navy e off-white em comum, cor de assinatura própria no raio de cada logo. Proposta para aprovação, sem alterar as logos oficiais.</p></div>
    <div class="tema" role="group" aria-label="Tema">
      <button type="button" data-t="light">Claro</button><button type="button" data-t="dark">Escuro</button><button type="button" data-t="">Sistema</button>
    </div>
  </header>

  <h2>As sete paletas lado a lado</h2>
  <p class="lede">Quatro marcas oficiais (logo no kit v1) e três planejadas, identificadas como proposta. Os botões e marcadores abaixo usam os tokens reais de cada marca no tema atual.</p>
  <div class="paletas">${S.map(cardPaleta).join("")}</div>

  <h2>Logos oficiais com a cor de assinatura</h2>
  <p class="lede">Só o preenchimento do raio mudou; letras, proporções e símbolos são os do kit v1. A versão clara é para fundos claros e a escura para fundos escuros. Os favicons estão em tamanho real (32 e 16 px).</p>
  <div class="logos">${S.filter((m) => m.oficial).map((m) => `
    <div class="lrow" data-brand="${m.id}">
      <div class="c1">${logo(m, "assinatura-completa")}</div>
      <div class="c2">${logo(m, "compacta")}</div>
      <div class="c3">${logo(m, "monograma")}</div>
      <div class="favs"><span><img class="so-claro" src="favicons/${m.id}/claro/favicon-32x32.png" width="32" height="32" alt=""><img class="so-escuro" src="favicons/${m.id}/escuro/favicon-32x32.png" width="32" height="32" alt="">32</span><span><img class="so-claro" src="favicons/${m.id}/claro/favicon-16x16.png" width="16" height="16" alt=""><img class="so-escuro" src="favicons/${m.id}/escuro/favicon-16x16.png" width="16" height="16" alt="">16</span></div>
    </div>`).join("")}
  </div>

  <h2>Na interface: cabeçalho, menu lateral, botão, card e checkout</h2>
  <p class="lede">Superfícies neutras; a cor de assinatura aparece no botão principal, no item ativo, na seleção do checkout, nos links e no anel de foco.</p>
  <div class="apps">${S.map(app).join("")}</div>

  <h2>Cores de estado (iguais em todas as marcas)</h2>
  <p class="lede">Sucesso, alerta, erro e informação nunca dependem só da cor: sempre têm ícone e texto. Isso evita confusão com o verde do SuperDrop, o azul do Commerce e o amarelo do grupo.</p>
  <div class="sems">
    <div class="al a-ok">${ICON.ok}<div><b>Pagamento confirmado</b>Pedido liberado para separação.</div></div>
    <div class="al a-al">${ICON.alerta}<div><b>Saldo baixo</b>Recarregue para não travar pedidos.</div></div>
    <div class="al a-er">${ICON.erro}<div><b>Falha no pagamento</b>O cartão foi recusado pelo banco.</div></div>
    <div class="al a-in">${ICON.info}<div><b>Nova versão do tema</b>Veja o que mudou antes de publicar.</div></div>
  </div>

  <p class="nota">Arquivos: tokens.css, tokens.json, paletas.json, contrastes.csv. As marcas NextLevel Play, China Hub e Brás Digital ainda não têm logo oficial: aqui aparecem só com o nome em texto e a cor proposta.</p>
</div>
<script>
(function(){var b=document.querySelectorAll(".tema button"),h=document.documentElement;function s(){var t=h.getAttribute("data-theme")||"";b.forEach(function(x){x.setAttribute("aria-pressed",String(x.dataset.t===t))})}
b.forEach(function(x){x.addEventListener("click",function(){if(x.dataset.t)h.setAttribute("data-theme",x.dataset.t);else h.removeAttribute("data-theme");try{localStorage.setItem("nl-preview-tema",x.dataset.t)}catch(e){}s()})});s()})();
</script>
</body>
</html>
`;
writeFileSync(`${OUT}/preview.html`, preview);

// ------------------------------- prancha (comparativo.png) -------------------------------
mkdirSync(`${OUT}/ferramentas`, { recursive: true });
const of = S.filter((m) => m.oficial);
const painel = (m, tema) => `
  <div class="pn ${tema}" data-theme="${tema === "claro" ? "light" : "dark"}" data-brand="${m.id}">
    <img class="a" src="../logos/${m.id}/${tema}/assinatura-completa.svg" alt="${esc(m.nome)}">
    <div class="pn-b"><img class="m" src="../logos/${m.id}/${tema}/monograma.svg" alt=""><img class="f" src="../favicons/${m.id}/${tema}/favicon-32x32.png" alt="" width="32" height="32"><img class="f" src="../favicons/${m.id}/${tema}/favicon-16x16.png" alt="" width="16" height="16"></div>
  </div>`;
const prancha = `<!doctype html><html lang="pt-BR" data-theme="light"><head><meta charset="utf-8"><title>Prancha</title><link rel="stylesheet" href="../tokens.css"><style>${BASE_CSS}
body{width:2400px;padding:56px;background:#E6E3DA}
h1{margin:0 0 6px;font-size:44px;letter-spacing:-.02em;color:${NAVY}}
.sub{margin:0 0 36px;font-size:20px;color:#4A5268}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.row-l{grid-column:1/-1;font-size:18px;font-weight:700;color:#4A5268;margin:10px 0 -6px;text-transform:uppercase;letter-spacing:.12em}
.pn{border-radius:22px;padding:34px 40px;display:flex;align-items:center;justify-content:space-between;gap:24px;height:220px}
.pn.claro{background:${OFFWHITE}}.pn.escuro{background:${NAVY}}
.pn .a{height:150px;width:auto;max-width:660px}
.pn-b{display:flex;align-items:center;gap:18px}
.pn .m{height:90px;width:auto}
.pn .f{border-radius:4px}
.cores{display:grid;grid-template-columns:repeat(7,1fr);gap:14px;margin-top:40px}
.c{background:#fff;border-radius:18px;padding:14px;color:${NAVY}}
.c .sw{height:120px;border-radius:12px;margin-bottom:12px}
.c .sw2{display:flex;height:26px;border-radius:8px;overflow:hidden;margin-bottom:12px}.c .sw2 i{flex:1}
.c b{display:block;font-size:18px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.c span{display:block;font-size:15px;color:#4A5268}
.c code{display:block;font-size:15px;margin-top:6px;font-family:ui-monospace,Menlo,Consolas,monospace}
.c .st{display:inline-block;margin-top:10px;font-size:13px;font-weight:700;border:1.5px solid #7C8294;border-radius:999px;padding:2px 10px}
.c .st.pl{border-style:dashed}
</style></head><body>
<h1>Ecossistema NextLevel · cores de assinatura v2</h1>
<p class="sub">Quatro marcas oficiais em claro e escuro (assinatura completa, monograma e favicons 32/16 px) e as sete cores de assinatura. O raio leva a cor da marca; navy, off-white e o desenho das letras são compartilhados.</p>
<div class="grid">${of.map((m) => `<p class="row-l">${esc(m.nome)}</p>${painel(m, "claro")}${painel(m, "escuro")}`).join("")}</div>
<div class="cores">${S.map((m) => `<div class="c"><div class="sw" style="background:${m.assinatura}"></div><div class="sw2">${STEPS.map((s) => `<i style="background:${m.escala[s]}"></i>`).join("")}</div><b>${esc(m.nome.replace("NextLevel Soluções Digitais", "NextLevel (grupo)"))}</b><span>${esc(m.cor)}</span><code>${m.assinatura}</code><code>${oklchStr(m.assinatura)}</code><span class="st ${m.oficial ? "" : "pl"}">${m.oficial ? "Oficial" : "Planejada · sem logo"}</span></div>`).join("")}</div>
</body></html>`;
writeFileSync(`${OUT}/ferramentas/prancha.html`, prancha);
console.log("ok");
