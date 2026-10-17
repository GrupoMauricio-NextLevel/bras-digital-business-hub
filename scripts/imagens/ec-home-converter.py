"""
Home imersiva da NextLevel E-commerce: converte as fotos (PNG) para o site.
Uso (da raiz do repositório):  python3 -I scripts/imagens/ec-home-converter.py <pasta-com-os-png>
1. corta faixas brancas de storyboard nos 9% de cada borda (se houver);
2. ajusta a proporção 3:2 (paisagem) ou 2:3 (retrato) pelo centro;
3. grava AVIF e WebP em public/portal/nextlevel-ecommerce/v1/home/ (800/1400 paisagem, 640/960 retrato);
4. reescreve src/lib/marcas/ecommerce-home-imagens.ts com tamanhos e cor média.
Os nomes dos arquivos devem ser os do briefing (ec-jornada-1-produto.png, ec-porta-zero.png...). Quando as fotos
definitivas chegarem, troque EC_HOME_PROVISORIAS para false no arquivo gerado.
"""
import os, sys
from PIL import Image

SRC = sys.argv[1]
DST = "public/portal/nextlevel-ecommerce/v1/home"
TS = "src/lib/marcas/ecommerce-home-imagens.ts"
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

cab = open(TS).read().split("export const EC_HOME_FOTOS = {")[0]
open(TS, "w").write(cab + "export const EC_HOME_FOTOS = {\n" + "\n".join(linhas) + "\n} as const satisfies Record<string, EcFoto>;\nexport type EcFotoNome = keyof typeof EC_HOME_FOTOS;\n")
