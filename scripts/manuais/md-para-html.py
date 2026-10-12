"""Converte os guias de docs/manual/*.md em HTML pronto para PDF (usado por scripts/manuais/gerar-pdf.sh).
Uso: python3 scripts/manuais/md-para-html.py <arquivo.md> <saida.html> <tema: samuel|danielle> "<título da capa>" "<subtítulo>" "<para quem>"
Precisa do pacote Python `markdown` (pip install markdown)."""
import re, sys, html, pathlib, datetime
import markdown

src, out, tema, titulo, subtitulo, para = sys.argv[1:7]
root = pathlib.Path(__file__).resolve().parents[2]
fonts = root / "src/app/fonts"

def slug(value, separator="-"):
    # Mesmo formato das âncoras do GitHub: minúsculas, sem pontuação/emoji, espaços viram hífen.
    v = value.strip().lower()
    v = re.sub(r"[^\w\- ]", "", v)
    return v.replace(" ", separator)

text = pathlib.Path(src).read_text(encoding="utf-8")
# A capa substitui o título e o resumo do topo do arquivo (até o primeiro ---).
text = text.split("\n---\n", 1)[1] if text.startswith("# ") else text
body = markdown.markdown(text, extensions=["tables", "fenced_code", "toc", "sane_lists"], extension_configs={"toc": {"slugify": slug}})
# Só os endereços da demonstração viram link clicável; endereços reais ficam como texto (não devem ser acessados).
def _link(m):
    url = m.group(1).rstrip(".")
    return f'<a href="{url}">{url}</a>' + m.group(1)[len(url):]
body = re.sub(r'(?<![">/])(https://nextlevel-demo\.onrender\.com[^\s<,;)|]*)', _link, body)
# Avisos de "NÃO ACESSAR" em vermelho.
body = body.replace("<blockquote>\n<p>🚫", '<blockquote class="alerta">\n<p>🚫')
# Seções grandes (# MUNDO, # Módulo) começam em página nova.
body = re.sub(r"<h1 ", '<h1 class="nova-pagina" ', body)

cores = {"samuel": ("#0b1a3a", "#f5c518", "#fff7d6"), "danielle": ("#0b1a3a", "#1f7a6d", "#e3f2ef")}[tema]
hoje = datetime.date.today().strftime("%d/%m/%Y")
doc = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>{html.escape(titulo)}</title>
<style>
@font-face {{ font-family: Jakarta; src: url("file://{fonts}/jakarta-latin.woff2") format("woff2"); font-weight: 200 800; }}
@font-face {{ font-family: Inter; src: url("file://{fonts}/inter-latin.woff2") format("woff2"); font-weight: 100 900; }}
:root {{ --ink: {cores[0]}; --accent: {cores[1]}; --soft: {cores[2]}; }}
@page {{ size: A4; margin: 18mm 16mm 20mm 16mm; }}
* {{ box-sizing: border-box; }}
body {{ font-family: Inter, "Noto Color Emoji", sans-serif; font-size: 10.5pt; line-height: 1.55; color: #1c2333; margin: 0; }}
h1, h2, h3, h4 {{ font-family: Jakarta, Inter, "Noto Color Emoji", sans-serif; color: var(--ink); line-height: 1.25; break-after: avoid; }}
h1 {{ font-size: 22pt; margin: 0 0 10pt; padding: 10pt 14pt; background: var(--ink); color: #fff; border-radius: 10pt; border-left: 8pt solid var(--accent); }}
h1.nova-pagina {{ break-before: page; }}
h2 {{ font-size: 15pt; margin: 18pt 0 6pt; padding-bottom: 4pt; border-bottom: 2.5pt solid var(--accent); }}
h3 {{ font-size: 12.5pt; margin: 14pt 0 4pt; }}
p, li {{ orphans: 3; widows: 3; }}
a {{ color: var(--ink); text-decoration: underline; text-decoration-color: var(--accent); word-break: break-word; }}
code {{ font-family: "DejaVu Sans Mono", monospace; font-size: 8.8pt; background: #f1f3f8; padding: 0 3pt; border-radius: 3pt; word-break: break-all; }}
pre {{ background: var(--soft); border: 1pt solid #d9dee8; border-radius: 8pt; padding: 8pt 10pt; font-size: 8.4pt; line-height: 1.35; white-space: pre-wrap; break-inside: avoid; }}
pre code {{ background: none; padding: 0; word-break: normal; }}
blockquote {{ margin: 8pt 0; padding: 7pt 12pt; background: var(--soft); border-left: 5pt solid var(--accent); border-radius: 6pt; break-inside: avoid; }}
blockquote p {{ margin: 3pt 0; }}
blockquote.alerta {{ background: #fdecec; border-left-color: #c62828; color: #5b1010; }}
blockquote.alerta code {{ background: #f8d4d4; }}
table {{ width: 100%; border-collapse: collapse; margin: 8pt 0 10pt; font-size: 9pt; }}
th {{ background: var(--ink); color: #fff; text-align: left; padding: 5pt 6pt; font-family: Jakarta, Inter, sans-serif; }}
td {{ padding: 4.5pt 6pt; border-bottom: 1pt solid #e2e6ee; vertical-align: top; }}
tr {{ break-inside: avoid; }}
tbody tr:nth-child(even) td {{ background: #f7f8fb; }}
hr {{ border: none; border-top: 1pt dashed #c9cfdb; margin: 14pt 0; }}
.capa {{ height: 255mm; display: flex; flex-direction: column; justify-content: space-between; padding: 22mm 14mm; background: var(--ink); color: #fff; border-radius: 14pt; break-after: page; position: relative; overflow: hidden; }}
.capa::after {{ content: ""; position: absolute; right: -40mm; bottom: -40mm; width: 140mm; height: 140mm; border-radius: 50%; background: var(--accent); opacity: .9; }}
.capa .logo {{ font-family: Jakarta, Inter, sans-serif; font-size: 22pt; font-weight: 800; font-style: italic; margin: 0; letter-spacing: -.5pt; }} .capa .logo span {{ color: var(--accent); }}
.capa .t {{ font-family: Jakarta, Inter, "Noto Color Emoji", sans-serif; font-size: 34pt; font-weight: 800; line-height: 1.1; margin: 0; position: relative; z-index: 1; }}
.capa .s {{ font-size: 14pt; opacity: .9; margin-top: 10pt; max-width: 120mm; position: relative; z-index: 1; }}
.capa .p {{ font-size: 12pt; position: relative; z-index: 1; }}
.capa .p b {{ display: block; font-size: 18pt; color: var(--accent); }}
</style></head><body>
<section class="capa"><p class="logo">Next<span>Level</span></p><div><p class="t">{html.escape(titulo)}</p><p class="s">{html.escape(subtitulo)}</p></div><p class="p"><b>{html.escape(para)}</b>Grupo NextLevel · {hoje}</p></section>
{body}
</body></html>"""
pathlib.Path(out).write_text(doc, encoding="utf-8")
print("html:", out)
