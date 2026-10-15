"""O hero: a foto que o Eduardo mandou (fotos-dono/hero-vale-paiva.jpg,
3168×1344) vai para o site tal e qual, no ficheiro original, sem
recompressão nem tamanhos reduzidos (regra do hero).

Copia também, intactas, as fotos de COPIAS. Daqui saem ainda:
- a máscara do céu (site/assets/img/hero-mascara.png e, embutida, em
  site/mascara.css): tudo o que não é céu, para o nome ficar atrás da serra;
- a CUMEADA para o main.js (65 pontos: a primeira linha que não é céu em
  cada coluna, como fração da altura), impressa no fim.

Correr com `py -I scripts/hero.py`. O imagens.py corre-o no fim (apaga a
pasta das imagens antes de as gerar)."""
import os, shutil, base64, io
import numpy as np
import cv2
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = RAIZ + '/fotos-dono/hero-vale-paiva.jpg'
DST = RAIZ + '/site/assets/img/'
NOME = 'hero-paiva.jpg'

shutil.copyfile(SRC, DST + NOME)
# outras fotos que vão no ficheiro original (o tanque: 1200×1600 do Google,
# mostrado grande; a ampliação ficava pior do que o original)
COPIAS = {'dossie/marketing/fotos/exterior/detalhe-01.jpg': 'tanque-original.jpg'}
for de, para in COPIAS.items():
    shutil.copyfile(RAIZ + '/' + de, DST + para)
bgr = cv2.imread(SRC)
H0, W0 = bgr.shape[:2]

# 255 onde não é céu (serra, casas, árvores); 0 no céu ligado ao topo
im = cv2.resize(bgr, (2048, round(H0 * 2048 / W0)), interpolation=cv2.INTER_AREA)
hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV).astype(np.int32)
b, g, r = (im[..., k].astype(np.int32) for k in range(3))
Hh, S, V = hsv[..., 0], hsv[..., 1], hsv[..., 2]
azul = (Hh >= 95) & (Hh <= 125) & (V > 120) & (b > g + 8)
nuvem = (V > 165) & (S < 75) & (b >= r - 4)
ceu = (azul | nuvem).astype(np.uint8)
ceu = cv2.morphologyEx(ceu, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
n, lab = cv2.connectedComponents(ceu)
topo = [k for k in set(lab[0][ceu[0] > 0].tolist()) if k]
m = np.isin(lab, topo).astype(np.uint8) * 255
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
# buracos do céu abaixo da cumeada (céu visto entre folhas) não contam
h, w = m.shape
ceu_lig = np.zeros_like(m)
for x in range(w):
    col = m[:, x] > 127
    y = 0
    while y < h and col[y]:
        y += 1
    ceu_lig[:y, x] = 255
# à direita, a copa da árvore: o céu entre as folhas não conta (o nome nunca
# vai para lá, e a máscara fazia lá um retângulo)
ceu_lig[:, round(w * 0.8):] = 0
alfa = cv2.GaussianBlur(255 - ceu_lig, (0, 0), 1.2)

rgba = np.zeros((h, w, 4), np.uint8)
rgba[..., 3] = alfa
Image.fromarray(rgba, 'RGBA').save(DST + 'hero-mascara.png', optimize=True)

# embutida em mascara.css: aberto do disco (file://), o browser bloqueia uma
# mask-image noutro ficheiro, e a serra taparia o nome todo
buf = io.BytesIO()
Image.fromarray(rgba, 'RGBA').resize((1536, round(1536 * H0 / W0)), Image.LANCZOS).save(buf, 'PNG', optimize=True)
uri = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()
with open(RAIZ + '/site/mascara.css', 'w', encoding='utf-8') as f:
    f.write('/* Gerado por scripts/hero.py: a máscara do céu do hero (tudo o que não é céu). */\n'
            f'.hero__serra img {{ -webkit-mask-image: url({uri}); mask-image: url({uri}); }}\n')

# CUMEADA: 65 pontos
cum = []
for i in range(65):
    x = min(w - 1, round(i * (w - 1) / 64))
    col = ceu_lig[:, max(0, x - 2):x + 3].min(axis=1) > 127
    y = int(np.argmin(col)) if not col.all() else h
    cum.append(round(y / h, 3))
print('FOTO =', W0, '/', H0)
print('CUMEADA =', '[' + ', '.join(f'{v:.3f}' for v in cum) + ']')
