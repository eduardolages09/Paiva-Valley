"""As fotos das três atrações (secção «O vale»), a partir dos originais do
Wikimedia Commons em fotos-regiao/ (créditos em fotos-regiao/creditos.json,
no rodapé).

São fotos grandes e ao alto: aqui só se recortam no formato da moldura
(4:5, o mesmo de .atracao__foto, para o browser não voltar a cortar), com a
marca de água do fotógrafo fora do recorte, e se reduzem. Sem ampliação, sem
grão e sem tratamento de cor, para não perderem qualidade.

Corre sozinho (`py -I scripts/atracoes.py`) e no fim do scripts/imagens.py."""
import os
from PIL import Image, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG = RAIZ + '/fotos-regiao/'
DST = RAIZ + '/site/assets/img/'

# original: (nome no site, fração do corte tirada em cima; o resto sai em baixo)
FOTOS = {
    'praia-vau.jpg': ('atr-vau', .82),
    'ponte-516-tabuleiro.jpg': ('atr-ponte', .5),
    'passadicos-rio.jpg': ('atr-passadicos', .62),
}
TAMANHOS = ((1600, 90), (1200, 90), (800, 90))   # o maior é o do visor

for f, (nome, topo) in FOTOS.items():
    im = ImageOps.exif_transpose(Image.open(ORIG + f)).convert('RGB')
    w, h = im.size
    alt = round(w * 5 / 4)
    y = round((h - alt) * topo)
    im = im.crop((0, y, w, y + alt))
    for i, (larg, q) in enumerate(TAMANHOS):
        c = im.resize((larg, round(larg * 5 / 4)), Image.LANCZOS, reducing_gap=3.0)
        c.save(f'{DST}{nome}{"" if i == 0 else "-" + str(larg)}.jpg', quality=q, optimize=True, progressive=True, subsampling=0)
    print(nome, (w, h), '->', im.size)
