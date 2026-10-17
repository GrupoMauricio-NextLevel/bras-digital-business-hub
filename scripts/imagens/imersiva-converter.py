"""
Página imersiva de marca (D165): converte as fotos (PNG) de uma marca para o site e gera o acervo em TypeScript.
Uso (da raiz do repositório):
  python3 -I scripts/imagens/imersiva-converter.py <pasta-com-os-png> <pasta-publica> <arquivo-ts> <PREFIXO> [descrição]
  ex.: python3 -I scripts/imagens/imersiva-converter.py ~/fotos-sd public/portal/superdrop/v5/home src/lib/marcas/superdrop-home-imagens.ts SD_HOME "SuperDrop"
1. corta faixas brancas de storyboard nos 9% de cada borda (se houver);
2. ajusta a proporção 3:2 (paisagem) ou 2:3 (retrato) pelo centro;
3. grava AVIF e WebP (800/1400 paisagem, 640/960 retrato) na pasta pública;
4. escreve o arquivo TS com <PREFIXO>_BASE, <PREFIXO>_FOTOS, <PREFIXO>_ACERVO e o tipo dos nomes.
Os PNG originais ficam fora do repositório.
"""
import os, sys
from PIL import Image

SRC, DST, TS, PREFIXO = sys.argv[1:5]
DESCRICAO = sys.argv[5] if len(sys.argv) > 5 else PREFIXO
os.makedirs(DST, exist_ok=True)

def branca(px):
    return sum(1 for p in px if min(p) > 215) / len(px) > 0.55

def caixa(im):
    W, H = im.size; a = im.load()
    col = lambda x: branca([a[x, y] for y in range(0, H, 3)])
    row = lambda y: branca([a[x, y] for x in range(0, W, 3)])
    mw, mh = int(W * 0.09), int(H * 0.09)
    L = max([x + 1 for x in range(mw) if col(x)], default=0)
    R = max([x + 1 for x in range(mw) if col(W - 1 - x)], default=0)
    T = max([y + 1 for y in range(mh) if row(y)], default=0)
    B = max([y + 1 for y in range(mh) if row(H - 1 - y)], default=0)
    f = lambda v: v + 4 if v else 0
    return (f(L), f(T), W - f(R), H - f(B))

linhas = []
for f in sorted(os.listdir(SRC)):
    if not f.endswith(".png"): continue
    im = Image.open(os.path.join(SRC, f)).convert("RGB")
    im = im.crop(caixa(im))
    W, H = im.size; retrato = H > W; alvo = 2 / 3 if retrato else 3 / 2
    if W / H > alvo: nw = int(H * alvo); x = (W - nw) // 2; im = im.crop((x, 0, x + nw, H))
    else: nh = int(W / alvo); y = (H - nh) // 2; im = im.crop((0, y, W, y + nh))
    larguras = [640, 960] if retrato else [800, 1400]
    base = f[:-4]
    for w in larguras:
        r = im.resize((w, round(w / alvo)), Image.LANCZOS)
        r.save(os.path.join(DST, f"{base}-{w}.webp"), quality=74, method=6)
        r.save(os.path.join(DST, f"{base}-{w}.avif"), quality=52, speed=4)
    cor = "#%02x%02x%02x" % im.resize((1, 1), Image.LANCZOS).getpixel((0, 0))
    linhas.append(f'  "{base}": {{ larguras: [{larguras[0]}, {larguras[1]}], w: {larguras[1]}, h: {round(larguras[1] / alvo)}, cor: "{cor}" }},')
    print(base, im.size, cor)

publico = "/" + DST.split("public/", 1)[1].strip("/")
nome_tipo = "".join(p.capitalize() for p in PREFIXO.lower().split("_")) + "FotoNome"
cabecalho = f'''/**
 * Fotos da página imersiva da {DESCRICAO} (gerado por scripts/imagens/imersiva-converter.py; não edite à mão).
 * AVIF e WebP em duas larguras (paisagem 800/1400, retrato 640/960); `cor`: cor média, fundo enquanto a foto carrega.
 */
import type {{ Acervo, FotoImersiva }} from "@/lib/imersiva/acervo";

export const {PREFIXO}_BASE = "{publico}";
'''
if os.path.exists(TS) and "export const " + PREFIXO + "_FOTOS = {" in open(TS).read():
    cabecalho = open(TS).read().split("export const " + PREFIXO + "_FOTOS = {")[0]
corpo = f"export const {PREFIXO}_FOTOS = {{\n" + "\n".join(linhas) + f"\n}} as const satisfies Record<string, FotoImersiva>;\nexport type {nome_tipo} = keyof typeof {PREFIXO}_FOTOS;\n"
corpo += f"\n/** Acervo no formato da peça única `src/components/imersiva`. */\nexport const {PREFIXO}_ACERVO: Acervo<{nome_tipo}> = {{ base: {PREFIXO}_BASE, fotos: {PREFIXO}_FOTOS }};\n"
open(TS, "w").write(cabecalho + corpo)
