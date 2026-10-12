"""Converte os guias de docs/manual/*.md em HTML pronto para PDF (usado por scripts/manuais/gerar-pdf.sh).

Uso: python3 scripts/manuais/md-para-html.py <arquivo.md> <saida.html> <tema: samuel|danielle> <modo: escuro|claro> "<título>" "<subtítulo>" "<para quem>"

- samuel: visual de jogo (mapa das fases, cartões de missão, barra de XP, medalhas, chefões).
- danielle: leitura confortável (letra grande, alto contraste, espaçamento largo), cartões só onde ajudam.
- escuro: para ler à noite (fundo escuro na página inteira); claro: para imprimir.
Precisa dos pacotes Python `markdown` e `beautifulsoup4`.
"""
import re, sys, html, pathlib, datetime
import markdown
from bs4 import BeautifulSoup, NavigableString

src, out, tema, modo, titulo, subtitulo, para = sys.argv[1:8]
root = pathlib.Path(__file__).resolve().parents[2]
fonts = root / "src/app/fonts"
escuro = modo == "escuro"


def slug(value, separator="-"):
    # Mesmo formato das âncoras do GitHub: minúsculas, sem pontuação/emoji, espaços viram hífen.
    v = value.strip().lower()
    v = re.sub(r"[^\w\- ]", "", v)
    return v.replace(" ", separator)


text = pathlib.Path(src).read_text(encoding="utf-8")
text = text.split("\n---\n", 1)[1] if text.startswith("# ") else text  # a capa substitui o topo do arquivo
body = markdown.markdown(text, extensions=["tables", "fenced_code", "toc", "sane_lists"], extension_configs={"toc": {"slugify": slug}})
soup = BeautifulSoup(body, "html.parser")


def new(tag, cls=None, text=None, **attrs):
    t = soup.new_tag(tag, **attrs)
    if cls: t["class"] = cls
    if text is not None: t.string = text
    return t


def frag(markup):
    return BeautifulSoup(markup, "html.parser")


# ---- Links: só a demonstração é clicável; endereços reais ficam como texto -------------------------------------------
for node in list(soup.find_all(string=re.compile(r"https://nextlevel-demo\.onrender\.com"))):
    if node.find_parent(["a", "code", "pre"]): continue
    parts = re.split(r"(https://nextlevel-demo\.onrender\.com[^\s<,;)|]*)", str(node))
    repl = []
    for p in parts:
        if p.startswith("https://nextlevel-demo"):
            url = p.rstrip(".")
            a = new("a", href=url); a.string = url; repl.append(a)
            if len(url) < len(p): repl.append(NavigableString(p[len(url):]))
        elif p: repl.append(NavigableString(p))
    for r in repl: node.insert_before(r)
    node.extract()

# ---- Avisos "NÃO ACESSAR" em vermelho ----------------------------------------------------------------------------------
for bq in soup.find_all("blockquote"):
    if "🚫" in bq.get_text()[:4] or "NÃO ACESSAR" in bq.get_text()[:60]:
        bq["class"] = ["alerta"]

# ---- Cartões de missão: título + lista "**Rótulo:** texto" ------------------------------------------------------------
ICON = [("link", "🔗"), ("como chegar", "🧭"), ("o que tem", "📦"), ("o que é", "📦"), ("por que", "💡"), ("como testar", "🧪"),
        ("observe", "🔍"), ("anote", "✍️"), ("pergunta", "❓"), ("exercício", "🏋️"), ("bônus", "⭐"), ("importante", "⚠️"),
        ("conceito", "🧠"), ("atenção", "⚠️")]


def icon_for(label):
    l = label.lower()
    for k, ic in ICON:
        if k in l: return ic
    return "▸"


for h in soup.find_all(["h3"]):
    ul = h.find_next_sibling()
    if not ul or ul.name != "ul": continue
    lis = ul.find_all("li", recursive=False)
    if not lis or not all(li.find("strong") and li.contents and getattr(li.contents[0], "name", None) == "strong" for li in lis): continue
    card = new("div", ["missao"])
    h.insert_before(card)
    card.append(h.extract())
    for li in lis:
        strong = li.find("strong")
        label = strong.get_text().rstrip(":")
        strong.extract()
        row = new("div", ["linha"])
        row.append(new("span", ["ic"], icon_for(label)))
        lab = new("span", ["rot"], label)
        row.append(lab)
        val = new("span", ["val"])
        for c in list(li.contents): val.append(c.extract())
        row.append(val)
        card.append(row)
    ul.extract()

# ---- Tabelas em cartões (Samuel) ---------------------------------------------------------------------------------------
FIELD_ICON = [("link", "🔗"), ("e-mail", "🔑"), ("use no", "🗺️"), ("para quê", "🎯"), ("como usar", "🛠️"), ("o que tem", "📦"),
              ("por que", "💡"), ("como testar", "🧪"), ("o que testar", "🧪"), ("o que observar", "🔍"), ("quem", "👤"), ("painel", "🖥️"),
              ("situação", "📍"), ("em uma frase", "💬"), ("endereço real", "🚫"), ("o que faz", "⚙️"), ("onde", "📍"), ("como ganhar", "🏆"),
              ("como fazer", "🕹️"), ("o que procurar", "🔍"), ("exemplo", "💬"), ("pergunta", "❓"), ("como conseguir", "🧭"), ("quem recebe", "👤")]


def field_icon(h):
    l = h.lower()
    for k, ic in FIELD_ICON:
        if k in l: return ic
    return "▸"


def cells(tr):
    return [c for c in tr.find_all(["td", "th"], recursive=False)]


def table_rows(t):
    head = [c.get_text(" ", strip=True) for c in cells(t.find("tr"))]
    rows = [cells(tr) for tr in t.find_all("tr")[1:]]
    return head, rows


def move_children(src_el, dst):
    for c in list(src_el.contents): dst.append(c.extract())
    return dst


RANK_EMOJI = {"Recruta": "🥉", "Explorador": "🧭", "Inspetor": "🔎", "Detetive": "🕵️", "Arquiteto": "🏗️", "Mestre do Sistema": "🧙"}

if tema == "samuel":
    for t in list(soup.find_all("table")):
        head, rows = table_rows(t)
        hl = [h.lower() for h in head]
        if head and head[0].startswith("✔"):
            t["class"] = ["checklist"]; continue
        if any("superpoder" in h for h in hl):  # os 10 superpoderes em quadradinhos
            grid = new("div", ["poderes"])
            for r in rows:
                tile = new("div", ["poder"])
                tile.append(new("div", ["num"], r[0].get_text(strip=True)))
                d = new("div", ["nome"]); move_children(r[1], d); tile.append(d)
                d = new("div", ["como"]); move_children(r[2], d); tile.append(d)
                d = new("div", ["procura"]); d.append(new("b", text="🔍 ")); move_children(r[3], d); tile.append(d)
                grid.append(tile)
            t.replace_with(grid); continue
        if hl[:2] == ["patente", "xp"]:  # barra de XP com as patentes
            bar = new("div", ["xpbar"])
            for r in rows:
                name, xp = r[0].get_text(strip=True), r[1].get_text(strip=True)
                name_clean = re.sub(r"^\W+\s*", "", name)
                step = new("div", ["degrau"])
                step.append(new("div", ["em"], RANK_EMOJI.get(name_clean, name.split(" ")[0])))
                step.append(new("div", ["nm"], name_clean))
                step.append(new("div", ["xp"], f"{xp} XP"))
                bar.append(step)
            t.replace_with(bar); continue
        if hl[:2] == ["medalha", "como ganhar"]:  # medalhas redondas
            grid = new("div", ["medalhas"])
            for r in rows:
                name = r[0].get_text(strip=True)
                em, nm = (name.split(" ", 1) + [""])[:2]
                m = new("div", ["medalha"])
                m.append(new("div", ["disco"], em))
                m.append(new("div", ["nm"], nm))
                d = new("div", ["cg"]); move_children(r[1], d); m.append(d)
                grid.append(m)
            t.replace_with(grid); continue
        if hl[:2] == ["cor", "nome"]:  # escala de problemas
            grid = new("div", ["escala"])
            for r in rows:
                em = r[0].get_text(strip=True)
                c = new("div", ["nivel", {"🔴": "vermelho", "🟠": "laranja", "🟡": "amarelo", "🟢": "verde"}.get(em, "verde")])
                c.append(new("div", ["em"], em))
                d = new("div", ["nm"]); move_children(r[1], d); c.append(d)
                d = new("div", ["ex"]); move_children(r[2], d); c.append(d)
                c.append(new("div", ["pts"], f"+{r[3].get_text(strip=True)} XP"))
                grid.append(c)
            t.replace_with(grid); continue
        if hl[:2] == ["ação", "xp"]:  # pontos
            grid = new("div", ["pontos"])
            for r in rows:
                c = new("div", ["ponto"])
                c.append(new("div", ["v"], r[1].get_text(strip=True)))
                d = new("div", ["a"]); move_children(r[0], d); c.append(d)
                grid.append(c)
            t.replace_with(grid); continue
        # Genérico: cada linha vira um cartão.
        grid = new("div", ["cartoes", "duas" if len(head) <= 3 else "uma"])
        for r in rows:
            c = new("div", ["cartao"])
            tt = new("div", ["tt"]); move_children(r[0], tt); c.append(tt)
            for h, cell in zip(head[1:], r[1:]):
                if not cell.get_text(strip=True): continue
                f = new("div", ["campo"])
                f.append(new("span", ["ic"], field_icon(h)))
                f.append(new("span", ["rot"], h))
                v = new("span", ["val"]); move_children(cell, v); f.append(v)
                c.append(f)
            grid.append(c)
        t.replace_with(grid)

    # Índice → mapa de fases em quadradinhos.
    ind = soup.find(id=re.compile(r"índice$"))
    ol = ind.find_next_sibling("ol") if ind else None
    if ol:
        grid = new("div", ["fases"])
        for li in ol.find_all("li", recursive=False):
            a = li.find("a")
            tile = new("a", ["fase"], href=a["href"] if a else "#")
            tile.string = a.get_text() if a else li.get_text()
            grid.append(tile)
        ol.replace_with(grid)

    # Mundos: faixa de abertura de fase.
    WORLD_EMOJI = {1: "🌍", 2: "🛍️", 3: "🏪", 4: "🎨", 5: "🏭", 6: "🤝", 7: "🧳", 8: "🚚", 9: "👑", 10: "🗝️"}
    for h1 in soup.find_all("h1"):
        m = re.match(r"MUNDO (\d+):\s*(.*)", h1.get_text(strip=True))
        if not m: continue
        n = int(m.group(1))
        banner = frag(f'<div class="mundo" id="{h1.get("id", "")}"><div class="mn"><span>MUNDO</span><b>{n}</b></div>'
                      f'<div class="mt">{html.escape(m.group(2))}</div><div class="me">{WORLD_EMOJI.get(n, "⭐")}</div></div>')
        h1.replace_with(banner)
    for div in soup.select("div.mundo"):
        bq = div.find_next_sibling()
        if bq and bq.name == "blockquote" and "alerta" not in (bq.get("class") or []): bq["class"] = ["briefing"]

    # Chefões e desafios.
    for h in soup.find_all("h3"):
        t = h.get_text(strip=True)
        kind = "boss" if t.startswith("Chefão") else "desafio" if t.startswith("Desafio") else None
        if not kind: continue
        card = new("div", [kind])
        h.insert_before(card)
        el = h
        while el is not None and not (el is not h and el.name in ("h2", "h3", "h1", "hr")):
            nxt = el.find_next_sibling()
            card.append(el.extract())
            el = nxt

    # Diagrama do dinheiro e fichas.
    for pre in soup.find_all("pre"):
        t = pre.get_text()
        if "Cliente paga" in t:
            pre.replace_with(frag("""<div class="diagrama"><svg viewBox="0 0 680 300" xmlns="http://www.w3.org/2000/svg" font-family="Jakarta, Inter, sans-serif">
<defs><marker id="seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--acc)"/></marker></defs>
<g font-size="15" font-weight="700" text-anchor="middle">
<rect x="20" y="110" width="150" height="80" rx="16" fill="var(--card)" stroke="var(--acc2)" stroke-width="3"/><text x="95" y="145" font-size="30">🛒</text><text x="95" y="175" fill="var(--txt)">Cliente</text>
<rect x="265" y="20" width="150" height="80" rx="16" fill="var(--card)" stroke="var(--acc)" stroke-width="3"/><text x="340" y="55" font-size="30">🏪</text><text x="340" y="85" fill="var(--txt)">Lojista</text>
<rect x="510" y="110" width="150" height="80" rx="16" fill="var(--card)" stroke="var(--acc3)" stroke-width="3"/><text x="585" y="145" font-size="30">🏭</text><text x="585" y="175" fill="var(--txt)">Fornecedor</text>
<rect x="265" y="200" width="150" height="80" rx="16" fill="var(--card)" stroke="var(--acc4)" stroke-width="3"/><text x="340" y="235" font-size="30">👑</text><text x="340" y="265" fill="var(--txt)">NextLevel</text>
</g>
<g fill="none" stroke="var(--acc)" stroke-width="3" marker-end="url(#seta)">
<path d="M150 112 L265 70"/><path d="M415 70 L530 112"/><path d="M510 170 L170 170" stroke-dasharray="7 6"/><path d="M340 100 L340 200"/><path d="M510 190 L415 230"/>
</g>
<g font-size="12.5" fill="var(--txt2)" text-anchor="middle" font-weight="600">
<text x="190" y="78">paga R$ 100 na loja</text><text x="490" y="78">recarrega saldo (Pix)</text>
<text x="340" y="160">envia o produto ao cliente</text><text x="372" y="150" text-anchor="start"> </text>
<text x="290" y="150" text-anchor="end">mensalidade</text><text x="290" y="166" text-anchor="end">+ taxas</text>
<text x="500" y="232">mensalidade + taxas</text>
</g></svg><p class="legenda">O dinheiro do cliente vai direto para o lojista. O lojista recarrega saldo no fornecedor, o fornecedor envia o produto, e a NextLevel cobra mensalidade e taxas à parte.</p></div>"""))
        elif "FICHA" in t or "RELATÓRIO" in t:
            pre["class"] = ["ficha"]

    # Mapa da aventura antes do Mundo 1.
    m1 = soup.select_one("div.mundo")
    if m1:
        names = ["Portais", "Vitrines", "Lojista", "Commerce", "Fornecedor", "Parceiro", "Brás", "Cargas", "Master", "Segredos"]
        em = ["🌍", "🛍️", "🏪", "🎨", "🏭", "🤝", "🧳", "🚚", "👑", "🗝️"]
        pts = [(70, 80), (190, 80), (310, 80), (430, 80), (550, 80), (610, 200), (490, 200), (370, 200), (250, 200), (130, 200)]
        path = "M" + " L".join(f"{x},{y}" for x, y in pts) + " L40,300"
        nodes = "".join(f'<g><circle cx="{x}" cy="{y}" r="34" fill="var(--card)" stroke="var(--acc)" stroke-width="4"/><text x="{x}" y="{y + 10}" font-size="28" text-anchor="middle">{e}</text>'
                        f'<circle cx="{x + 26}" cy="{y - 26}" r="13" fill="var(--acc)"/><text x="{x + 26}" y="{y - 21}" font-size="13" font-weight="800" text-anchor="middle" fill="var(--on-acc)">{i + 1}</text>'
                        f'<text x="{x}" y="{y + 56}" font-size="14" font-weight="700" text-anchor="middle" fill="var(--txt)">{n}</text></g>'
                        for i, ((x, y), e, n) in enumerate(zip(pts, em, names)))
        svg = (f'<div class="mapa"><h2 class="mapa-t">🗺️ Mapa da aventura</h2><svg viewBox="0 0 680 340" xmlns="http://www.w3.org/2000/svg" font-family="Jakarta, Inter, sans-serif">'
               f'<path d="{path}" fill="none" stroke="var(--acc2)" stroke-width="6" stroke-dasharray="2 14" stroke-linecap="round"/>{nodes}'
               f'<g><rect x="4" y="290" width="200" height="44" rx="14" fill="var(--boss)"/><text x="104" y="319" font-size="17" font-weight="800" text-anchor="middle" fill="#fff">👹 Os 5 Chefões</text></g></svg>'
               f'<p class="legenda">Uma fase por vez. Cada fase concluída vale uma medalha; no fim, os chefões.</p></div>')
        m1.insert_before(frag(svg))

# ---- Danielle: tabelas ficam tabelas (letra grande), módulos com faixa ---------------------------------------------------
if tema == "danielle":
    # Tabelas com e-mail viram cartões: o e-mail fica inteiro numa linha, sem quebrar no meio.
    for t in list(soup.find_all("table")):
        head, rows = table_rows(t)
        if not any("e-mail" in h.lower() for h in head): continue
        grid = new("div", ["cartoes", "uma", "rotulos"])
        for r in rows:
            c = new("div", ["cartao"])
            tt = new("div", ["tt"]); move_children(r[0], tt); c.append(tt)
            for h, cell in zip(head[1:], r[1:]):
                f = new("div", ["campo"])
                f.append(new("span", ["ic"], field_icon(h)))
                f.append(new("span", ["rot"], h))
                v = new("span", ["val"]); move_children(cell, v); f.append(v)
                c.append(f)
            grid.append(c)
        t.replace_with(grid)
    for h1 in soup.find_all("h1"):
        m = re.match(r"Módulo (\d+):\s*(.*)", h1.get_text(strip=True))
        if m:
            h1.replace_with(frag(f'<div class="modulo" id="{h1.get("id", "")}"><div class="mn"><span>MÓDULO</span><b>{m.group(1)}</b></div><div class="mt">{html.escape(m.group(2))}</div></div>'))
    for pre in soup.find_all("pre"):
        if "FICHA" in pre.get_text() or "RELATÓRIO" in pre.get_text(): pre["class"] = ["ficha"]

# Seções grandes começam em página nova.
for el in soup.select("h1, div.mundo, div.modulo"):
    el["class"] = (el.get("class") or []) + ["nova-pagina"]

body = str(soup)

# ---- Cores e tamanhos -------------------------------------------------------------------------------------------------
if tema == "samuel":
    cores = dict(bg="#0d1022", card="#181d3a", card2="#20264a", txt="#eef1ff", txt2="#b8c0e6", acc="#f5c518", on_acc="#1a1300", acc2="#22d3ee", acc3="#a78bfa", acc4="#f472b6", boss="#e11d48", line="#2c3363", code="#262c55") if escuro else \
            dict(bg="#ffffff", card="#f5f6fb", card2="#eceffa", txt="#151a33", txt2="#4a5175", acc="#e0a800", on_acc="#1a1300", acc2="#0891b2", acc3="#7c3aed", acc4="#db2777", boss="#be123c", line="#d9ddef", code="#e8eaf6")
    base_pt, tabela_pt, lh = 11.5, 10.5, 1.55
else:
    cores = dict(bg="#13171d", card="#1c222b", card2="#232a35", txt="#e9edf2", txt2="#c4ccd6", acc="#5fd4b8", on_acc="#06221b", acc2="#8ab4f8", acc3="#f2c46d", acc4="#f28b82", boss="#f28b82", line="#334050", code="#252d38") if escuro else \
            dict(bg="#ffffff", card="#f4f7f8", card2="#e9eff0", txt="#111820", txt2="#33404d", acc="#0f7a66", on_acc="#ffffff", acc2="#1a56b0", acc3="#9a6700", acc4="#b3261e", boss="#b3261e", line="#cfd8dc", code="#e8eef0")
    base_pt, tabela_pt, lh = 14.5, 13, 1.7

hoje = datetime.date.today().strftime("%d/%m/%Y")
c = cores
css = f"""
@font-face {{ font-family: Jakarta; src: url("file://{fonts}/jakarta-latin.woff2") format("woff2"); font-weight: 200 800; }}
@font-face {{ font-family: Inter; src: url("file://{fonts}/inter-latin.woff2") format("woff2"); font-weight: 100 900; }}
:root {{ --bg:{c['bg']}; --card:{c['card']}; --card2:{c['card2']}; --txt:{c['txt']}; --txt2:{c['txt2']}; --acc:{c['acc']}; --on-acc:{c['on_acc']}; --acc2:{c['acc2']}; --acc3:{c['acc3']}; --acc4:{c['acc4']}; --boss:{c['boss']}; --line:{c['line']}; --code:{c['code']}; }}
@page {{ size: A4; margin: {'16mm 14mm 18mm 14mm' if tema == 'samuel' else '15mm 13mm 17mm 13mm'}; background: var(--bg); }}
* {{ box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
html, body {{ background: var(--bg); }}
body {{ font-family: Inter, "Noto Color Emoji", sans-serif; font-size: {base_pt}pt; line-height: {lh}; color: var(--txt); margin: 0; {'letter-spacing: .15pt; word-spacing: .6pt;' if tema == 'danielle' else ''} }}
h1, h2, h3, h4 {{ font-family: Jakarta, Inter, "Noto Color Emoji", sans-serif; color: var(--txt); line-height: 1.25; break-after: avoid; }}
h1 {{ font-size: {base_pt * 2:.0f}pt; margin: 0 0 12pt; padding: 12pt 16pt; background: var(--card); border-radius: 12pt; border-left: 8pt solid var(--acc); }}
.nova-pagina {{ break-before: page; }}
h2 {{ font-size: {base_pt * 1.4:.1f}pt; margin: 20pt 0 8pt; padding-bottom: 5pt; border-bottom: 3pt solid var(--acc); }}
h3 {{ font-size: {base_pt * 1.15:.1f}pt; margin: 14pt 0 6pt; color: var(--acc); }}
p, li {{ orphans: 3; widows: 3; }}
p {{ margin: 0 0 {base_pt * 0.7:.0f}pt; }}
li {{ margin-bottom: 4pt; }}
strong {{ color: var(--txt); }}
a {{ color: var(--acc2); text-decoration: underline; text-underline-offset: 2pt; word-break: break-word; }}
code {{ font-family: "DejaVu Sans Mono", monospace; font-size: {base_pt * 0.86:.1f}pt; background: var(--code); color: var(--txt); padding: 1pt 4pt; border-radius: 4pt; word-break: break-all; }}
pre {{ background: var(--card); border: 1.5pt solid var(--line); border-radius: 10pt; padding: 10pt 12pt; font-size: {base_pt * 0.8:.1f}pt; line-height: 1.4; white-space: pre-wrap; break-inside: avoid; color: var(--txt); }}
pre code {{ background: none; padding: 0; word-break: normal; font-size: inherit; }}
pre.ficha {{ border: 2pt dashed var(--acc); background: var(--card2); }}
blockquote {{ margin: 10pt 0; padding: 9pt 14pt; background: var(--card); border-left: 6pt solid var(--acc2); border-radius: 8pt; break-inside: avoid; }}
blockquote p {{ margin: 3pt 0; }}
blockquote.alerta {{ background: {'#3a1418' if escuro else '#fdecec'}; border-left-color: {'#ff6b6b' if escuro else '#c62828'}; color: {'#ffd9d9' if escuro else '#5b1010'}; }}
blockquote.alerta strong {{ color: {'#ffb3b3' if escuro else '#8e1212'}; }}
blockquote.alerta code {{ background: {'#5a1f25' if escuro else '#f8d4d4'}; color: inherit; }}
blockquote.briefing {{ border: 2pt solid var(--acc2); border-left-width: 8pt; background: var(--card2); }}
table {{ width: 100%; border-collapse: collapse; margin: 10pt 0 12pt; font-size: {tabela_pt}pt; }}
th {{ background: var(--acc); color: var(--on-acc); text-align: left; padding: 6pt 7pt; font-family: Jakarta, Inter, sans-serif; }}
td {{ padding: 6pt 7pt; border-bottom: 1pt solid var(--line); vertical-align: top; }}
tr {{ break-inside: avoid; }}
tbody tr:nth-child(even) td {{ background: var(--card); }}
hr {{ border: none; border-top: 1.5pt dashed var(--line); margin: 16pt 0; }}
.legenda {{ color: var(--txt2); font-size: {base_pt * 0.9:.1f}pt; text-align: center; margin-top: 4pt; }}
/* capa */
.capa {{ height: {'257mm' if tema == 'samuel' else '262mm'}; display: flex; flex-direction: column; justify-content: space-between; padding: 22mm 14mm; background: {'radial-gradient(circle at 80% 85%, ' + c['acc4'] + '33, transparent 45%), radial-gradient(circle at 15% 20%, ' + c['acc2'] + '33, transparent 40%), ' + c['card'] if tema == 'samuel' else c['card']}; color: var(--txt); border-radius: 16pt; break-after: page; position: relative; overflow: hidden; border: 2pt solid var(--line); }}
.capa .logo {{ font-family: Jakarta, Inter, sans-serif; font-size: 22pt; font-weight: 800; font-style: italic; margin: 0; }} .capa .logo span {{ color: var(--acc); }}
.capa .t {{ font-family: Jakarta, Inter, "Noto Color Emoji", sans-serif; font-size: {'40pt' if tema == 'samuel' else '36pt'}; font-weight: 800; line-height: 1.08; margin: 0; }}
.capa .s {{ font-size: {'14pt' if tema == 'samuel' else '16pt'}; color: var(--txt2); margin-top: 12pt; max-width: 140mm; }}
.capa .p {{ font-size: 13pt; }} .capa .p b {{ display: block; font-size: 20pt; color: var(--acc); }}
.capa .stats {{ display: flex; gap: 8pt; flex-wrap: wrap; margin-top: 16pt; }}
.capa .stats div {{ background: var(--bg); border: 2pt solid var(--acc); border-radius: 12pt; padding: 8pt 12pt; text-align: center; min-width: 30mm; }}
.capa .stats b {{ display: block; font-family: Jakarta, sans-serif; font-size: 22pt; color: var(--acc); line-height: 1.1; }}
.capa .stats span {{ font-size: 9pt; color: var(--txt2); text-transform: uppercase; letter-spacing: 1pt; }}
.capa .start {{ display: inline-block; margin-top: 18pt; padding: 8pt 18pt; border-radius: 30pt; background: var(--acc); color: var(--on-acc); font-family: Jakarta, sans-serif; font-weight: 800; letter-spacing: 2pt; }}
/* cartões de missão */
.missao {{ background: var(--card); border: 1.5pt solid var(--line); border-left: 6pt solid var(--acc); border-radius: 12pt; padding: 8pt 12pt 6pt; margin: 12pt 0; break-inside: avoid; }}
.missao h3 {{ margin: 2pt 0 8pt; }}
.missao .linha {{ display: grid; grid-template-columns: {'22pt 82pt 1fr' if tema == 'samuel' else '26pt 110pt 1fr'}; gap: 6pt; padding: 5pt 0; border-top: 1pt solid var(--line); align-items: start; }}
.missao .ic {{ font-size: {base_pt * 1.15:.0f}pt; line-height: 1.2; }}
.missao .rot {{ font-family: Jakarta, sans-serif; font-weight: 800; color: var(--acc2); font-size: {base_pt * 0.85:.1f}pt; text-transform: uppercase; letter-spacing: .5pt; padding-top: 2pt; }}
/* Samuel: peças visuais */
.mundo {{ display: grid; grid-template-columns: 70pt 1fr 60pt; align-items: center; gap: 12pt; padding: 14pt 16pt; border-radius: 16pt; margin-bottom: 14pt;
  background: linear-gradient(120deg, var(--card2), var(--card)); border: 2.5pt solid var(--acc); }}
.mundo .mn {{ background: var(--acc); color: var(--on-acc); border-radius: 14pt; text-align: center; padding: 6pt 0; font-family: Jakarta, sans-serif; }}
.mundo .mn span {{ display: block; font-size: 9pt; font-weight: 800; letter-spacing: 2pt; }} .mundo .mn b {{ font-size: 34pt; line-height: 1; }}
.mundo .mt {{ font-family: Jakarta, sans-serif; font-weight: 800; font-size: 20pt; line-height: 1.15; }}
.mundo .me {{ font-size: 40pt; text-align: center; }}
.fases {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 7pt; margin: 8pt 0 12pt; }}
.fase {{ display: block; background: var(--card); border: 1.5pt solid var(--line); border-radius: 10pt; padding: 7pt 9pt; color: var(--txt) !important; text-decoration: none !important; font-size: 9.5pt; font-weight: 600; min-height: 34pt; }}
.mapa {{ background: var(--card); border: 2pt solid var(--line); border-radius: 16pt; padding: 10pt 12pt; margin: 12pt 0; break-inside: avoid; }}
.mapa-t {{ border: none; margin: 0 0 4pt; }}
.diagrama {{ background: var(--card); border-radius: 14pt; padding: 10pt; margin: 10pt 0; break-inside: avoid; border: 1.5pt solid var(--line); }}
.cartoes {{ display: grid; gap: 8pt; margin: 10pt 0 14pt; }} .cartoes.duas {{ grid-template-columns: 1fr 1fr; }} .cartoes.uma {{ grid-template-columns: 1fr; }}
.cartao {{ background: var(--card); border: 1.5pt solid var(--line); border-top: 4pt solid var(--acc2); border-radius: 10pt; padding: 8pt 10pt; break-inside: avoid; font-size: 10.5pt; }}
.cartao .tt {{ font-family: Jakarta, sans-serif; font-weight: 800; font-size: 12pt; margin-bottom: 4pt; }}
.cartao .campo {{ display: grid; grid-template-columns: 18pt 1fr; column-gap: 4pt; padding: 3pt 0; border-top: 1pt solid var(--line); }}
.cartao .campo .rot {{ display: none; }}
.cartao .campo .val {{ grid-column: 2; }}
.rotulos .cartao {{ font-size: {base_pt:.1f}pt; }} .rotulos .cartao .tt {{ font-size: {base_pt * 1.1:.1f}pt; }}
.rotulos .cartao .campo {{ grid-template-columns: 24pt 80pt 1fr; }} .rotulos .cartao .campo .rot {{ display: block; grid-column: 2; font-weight: 700; color: var(--acc2); }} .rotulos .cartao .campo .val {{ grid-column: 3; }}
.rotulos code {{ word-break: keep-all; white-space: nowrap; }}
.poderes {{ display: grid; grid-template-columns: 1fr 1fr; gap: 8pt; margin: 10pt 0; }}
.poder {{ position: relative; background: var(--card); border: 2pt solid var(--acc3); border-radius: 14pt; padding: 10pt 10pt 8pt 46pt; break-inside: avoid; font-size: 10pt; }}
.poder .num {{ position: absolute; left: 9pt; top: 10pt; width: 28pt; height: 28pt; border-radius: 50%; background: var(--acc3); color: #fff; font-family: Jakarta, sans-serif; font-weight: 800; font-size: 13pt; text-align: center; line-height: 28pt; }}
.poder .nome {{ font-family: Jakarta, sans-serif; font-weight: 800; font-size: 12.5pt; margin-bottom: 3pt; }}
.poder .procura {{ color: var(--txt2); margin-top: 4pt; font-size: 9.5pt; }}
.xpbar {{ display: grid; grid-template-columns: repeat(6, 1fr); gap: 0; margin: 14pt 0 18pt; border-radius: 14pt; overflow: hidden; border: 2pt solid var(--acc); }}
.degrau {{ text-align: center; padding: 10pt 4pt; background: var(--card); border-right: 1.5pt solid var(--line); }}
.degrau:nth-child(1) {{ background: color-mix(in srgb, var(--acc) 8%, var(--card)); }} .degrau:nth-child(2) {{ background: color-mix(in srgb, var(--acc) 18%, var(--card)); }}
.degrau:nth-child(3) {{ background: color-mix(in srgb, var(--acc) 30%, var(--card)); }} .degrau:nth-child(4) {{ background: color-mix(in srgb, var(--acc) 45%, var(--card)); }}
.degrau:nth-child(5) {{ background: color-mix(in srgb, var(--acc) 62%, var(--card)); }} .degrau:nth-child(6) {{ background: var(--acc); color: var(--on-acc); }}
.degrau .em {{ font-size: 24pt; }} .degrau .nm {{ font-family: Jakarta, sans-serif; font-weight: 800; font-size: 10pt; }} .degrau .xp {{ font-size: 9pt; font-weight: 700; }}
.medalhas {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 8pt; margin: 10pt 0; }}
.medalha {{ text-align: center; background: var(--card); border-radius: 14pt; padding: 8pt 6pt; border: 1.5pt solid var(--line); break-inside: avoid; }}
.medalha .disco {{ width: 46pt; height: 46pt; margin: 0 auto 4pt; border-radius: 50%; border: 3pt solid var(--acc); background: var(--card2); font-size: 22pt; line-height: 40pt; }}
.medalha .nm {{ font-family: Jakarta, sans-serif; font-weight: 800; font-size: 10.5pt; }} .medalha .cg {{ font-size: 8.5pt; color: var(--txt2); line-height: 1.35; }}
.escala {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 8pt; margin: 10pt 0; }}
.nivel {{ border-radius: 14pt; padding: 10pt 8pt; text-align: center; background: var(--card); border: 2.5pt solid; break-inside: avoid; font-size: 9.5pt; }}
.nivel.vermelho {{ border-color: #ef4444; }} .nivel.laranja {{ border-color: #f97316; }} .nivel.amarelo {{ border-color: #eab308; }} .nivel.verde {{ border-color: #22c55e; }}
.nivel .em {{ font-size: 24pt; }} .nivel .nm {{ font-family: Jakarta, sans-serif; font-weight: 800; font-size: 12pt; }} .nivel .ex {{ color: var(--txt2); margin: 4pt 0; }}
.nivel .pts {{ display: inline-block; background: var(--acc); color: var(--on-acc); border-radius: 20pt; padding: 2pt 9pt; font-weight: 800; font-size: 10pt; }}
.pontos {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 7pt; margin: 10pt 0; }}
.ponto {{ display: flex; gap: 8pt; align-items: center; background: var(--card); border-radius: 12pt; padding: 7pt 9pt; border: 1.5pt solid var(--line); break-inside: avoid; font-size: 9.5pt; }}
.ponto .v {{ flex: none; min-width: 44pt; text-align: center; background: var(--acc); color: var(--on-acc); border-radius: 10pt; padding: 4pt 4pt; font-family: Jakarta, sans-serif; font-weight: 800; font-size: 11pt; }}
.boss {{ background: linear-gradient(135deg, color-mix(in srgb, var(--boss) 22%, var(--card)), var(--card)); border: 2.5pt solid var(--boss); border-radius: 16pt; padding: 10pt 14pt; margin: 14pt 0; break-inside: avoid; }}
.boss h3 {{ color: var(--txt); font-size: 15pt; }} .boss h3::before {{ content: "👹 "; }}
.boss ol {{ counter-reset: passo; list-style: none; padding-left: 0; }}
.boss ol li {{ counter-increment: passo; position: relative; padding-left: 30pt; margin-bottom: 6pt; }}
.boss ol li::before {{ content: counter(passo); position: absolute; left: 0; top: 0; width: 21pt; height: 21pt; border-radius: 50%; background: var(--boss); color: #fff; font-weight: 800; text-align: center; line-height: 21pt; font-size: 10pt; }}
.desafio {{ background: var(--card); border: 2pt solid var(--acc3); border-radius: 14pt; padding: 8pt 14pt; margin: 12pt 0; break-inside: avoid; }}
.desafio h3 {{ color: var(--acc3); }}
table.checklist {{ font-size: 9pt; }} table.checklist td:first-child {{ width: 18pt; text-align: center; }}
/* Danielle: faixa do módulo */
.modulo {{ display: grid; grid-template-columns: 78pt 1fr; align-items: center; gap: 14pt; padding: 14pt 16pt; border-radius: 14pt; margin-bottom: 14pt; background: var(--card); border: 2.5pt solid var(--acc); }}
.modulo .mn {{ background: var(--acc); color: var(--on-acc); border-radius: 12pt; text-align: center; padding: 6pt 0; font-family: Jakarta, sans-serif; }}
.modulo .mn span {{ display: block; font-size: 10pt; font-weight: 800; letter-spacing: 1.5pt; }} .modulo .mn b {{ font-size: 36pt; line-height: 1; }}
.modulo .mt {{ font-family: Jakarta, sans-serif; font-weight: 800; font-size: 24pt; line-height: 1.15; }}
"""

stats = ('<div class="stats"><div><b>10</b><span>mundos</span></div><div><b>213</b><span>telas</span></div><div><b>5</b><span>chefões</span></div><div><b>14</b><span>medalhas</span></div></div>'
         '<span class="start">▶ PRESS START</span>') if tema == "samuel" else \
        '<div class="stats"><div><b>6</b><span>módulos</span></div><div><b>40+</b><span>telas com dinheiro</span></div><div><b>3</b><span>rotinas</span></div></div>'
doc = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>{html.escape(titulo)}</title><style>{css}</style></head><body>
<section class="capa"><p class="logo">Next<span>Level</span></p><div><p class="t">{html.escape(titulo)}</p><p class="s">{html.escape(subtitulo)}</p>{stats}</div><p class="p"><b>{html.escape(para)}</b>Grupo NextLevel · {hoje} · {'modo escuro, para ler à noite' if escuro else 'versão clara, para imprimir'}</p></section>
{body}
</body></html>"""
pathlib.Path(out).write_text(doc, encoding="utf-8")
print("html:", out)
