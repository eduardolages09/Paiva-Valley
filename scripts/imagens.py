"""Prepara as fotos do site a partir das fotos do dossiê. Os originais do
dossiê nunca são tocados.

As fotos publicadas pela casa são pequenas (quase todas 600×600; a maior
horizontal tem 1024 px). Por isso cada foto passa por duas fases:

1. `fotos-ampliadas/x4/` — ampliação ×4 com o Real-ESRGAN (x4plus), feita
   uma vez com o executável realesrgan-ncnn-vulkan (ver o LEIA-ME da pasta).
2. Este script: mistura a ampliação (70 %) com uma ampliação simples
   Lanczos (30 %) para não ficar com ar de pintura, acalma as cores do
   telemóvel (céu azul elétrico, verde muito carregado), põe um grão leve e
   grava três tamanhos (o maior, 1400 e 800; o hero também 2000 e AVIF).

O hero já não sai daqui: é a foto que o Eduardo mandou, no ficheiro
original, e a máscara do céu sai dela (scripts/hero.py, que este script
corre no fim). A vista-01 (hero-vale) fica só no visor.

Para acrescentar uma foto: uma linha em MAP ('pasta/ficheiro do dossiê':
('nome', largura máxima, receita)), correr `py -I scripts/imagens.py` e pôr
o nome no catálogo SERIES de site/main.js.

Quando o dono enviar os originais, trocar a fonte pela foto dele e usar a
receita sem ampliação (AMPLIA = False na linha)."""
import os, sys, json
import numpy as np
import cv2
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = RAIZ + '/dossie/marketing/fotos/'
X4 = RAIZ + '/fotos-ampliadas/x4/'
DST = RAIZ + '/site/assets/img/'
os.makedirs(DST, exist_ok=True)
# `py -I scripts/imagens.py nome1 nome2` refaz só essas fotos, sem apagar
# as outras (nem correr o hero.py e o atracoes.py)
SO = set(sys.argv[1:])
if not SO:
    for f in os.listdir(DST):
        os.remove(DST + f)

FORA = {'sat': 0.86, 'quente': 2, 'sombras': 0.05}
CEU = {'sat': 0.8, 'quente': 2, 'sombras': 0.05}      # o azul do céu é o mais carregado
DENTRO = {'sat': 0.84, 'quente': 5, 'sombras': 0.07}  # a pedra vem cor de laranja
VERDE = {'sat': 0.82, 'quente': 0, 'sombras': 0.06}   # rio e mato muito verdes
# as fotos de fora da casa vinham com demasiado brilho (telemóvel ao sol:
# calçada, pedra e toldos quase brancos): sem clarear as sombras, baixa-se
# o meio (gama) e encolhem-se as altas luzes (ombro a partir do joelho)
LUZ = (1.25, .4, .66)
EXT = {'sat': 0.8, 'quente': 2, 'luz': LUZ}
EXT_FORA = {'sat': 0.86, 'quente': 2, 'luz': LUZ}

MAP = {
    # ---- as casas de pedra, a pérgola e o vale (o hero antigo; só no visor)
    'exterior/vista-01.jpg': ('hero-vale', 2000, EXT),
    # ---- a casa
    'exterior/fachada-02.jpg': ('casa-caminho', 1600, EXT),
    'exterior/fachada-01.jpg': ('casa-pedra', 1600, {'sat': 0.8, 'quente': 2}),
    'exterior/vista-02.jpg': ('casa-nevoeiro', 1600, {'sat': 0.86, 'quente': 2, 'luz': (1.12, .3, .7)}),
    'exterior/fachada-05.jpg': ('casas-muro', 1600, EXT),
    'exterior/fachada-03.jpg': ('casa-anoitecer', 1600, {'sat': 0.86, 'quente': 2, 'luz': (1.0, .4, .66)}),
    'exterior/jardim-02.jpg': ('muro-pedra', 1600, EXT),
    # ---- um pormenor: o tanque com o fuso de ferro (vertical, 1200x1600)
    'exterior/detalhe-01.jpg': ('tanque', 1800, EXT),
    # ---- lá fora: os espaços com nome
    'exterior/vista-05.jpg': ('terreiro-vale', 1600, EXT),
    'exterior/refeicoes-04.jpg': ('terreiro-mesas', 1600, EXT_FORA),
    'exterior/refeicoes-03.jpg': ('terreiro-mesa-posta', 1600, EXT_FORA),
    'exterior/refeicoes-01.jpg': ('ritmo-deck', 1600, EXT),
    'exterior/refeicoes-02.jpg': ('ritmo-sofas', 1600, EXT),
    'interior/sala-01.jpg': ('segredo-sala', 1600, DENTRO),
    'exterior/jardim-01.jpg': ('escadas-pergola', 1600, EXT),
    'exterior/jardim-04.jpg': ('arvore-pergola', 1600, EXT),
    'exterior/vista-04.jpg': ('janela-serra', 1600, CEU),
    # ---- os quartos
    'interior/quarto-01.jpg': ('paiva-1', 1600, DENTRO),
    'interior/quarto-02.jpg': ('paiva-2', 1600, DENTRO),
    'interior/quarto-03.jpg': ('vau-1', 1600, DENTRO),
    'interior/quarto-04.jpg': ('vau-2', 1600, DENTRO),
    'interior/quarto-05.jpg': ('arainho-1', 1600, DENTRO),
    'interior/quarto-06.jpg': ('arainho-2', 1600, DENTRO),
    'interior/cozinha-01.jpg': ('cozinha', 1600, DENTRO),
    # ---- a pausa: a serra no nevoeiro (faixa panorâmica)
    'exterior/vista-03.jpg': ('serra-nevoeiro', 3300, VERDE),
    # ---- o vale
    'regiao/regiao-02.jpg': ('rio-largo', 1600, VERDE),
    'regiao/regiao-03.jpg': ('rio-tronco', 1800, VERDE),
    'regiao/regiao-07.jpg': ('rio-encostas', 1600, VERDE),
    'regiao/regiao-08.jpg': ('cascata', 1600, VERDE),
    'regiao/regiao-05.jpg': ('rio-rapidos', 1600, VERDE),
    'regiao/regiao-06.jpg': ('rio-ponte', 1600, VERDE),
    'regiao/regiao-09.jpg': ('vale-alto', 1600, VERDE),
    'regiao/regiao-10.jpg': ('sobreiros', 1600, VERDE),
    # ---- as três atrações saem do scripts/atracoes.py (corre no fim)
}

AVIF = set()
MAIS = {'serra-nevoeiro': (2000,)}


def trata(bgr, sat=1.0, quente=0, sombras=0.0, luz=None):
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    L = lab[..., 0]
    if sombras:
        x = L / 255.0
        L = 255.0 * (x + sombras * 2.2 * x * (1 - x) ** 2)
    if luz:
        gama, ombro, joelho = luz
        x = (L / 255.0) ** gama
        alto = x > joelho
        x[alto] = joelho + (x[alto] - joelho) * (1 - ombro)
        L = 255.0 * x
    lab[..., 0] = np.clip(L, 0, 255)
    if quente:
        b = lab[..., 2] - 128
        lab[..., 2] = 128 + b - quente * np.clip(b / 40, 0, 1)
    out = cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)
    if sat != 1:
        hsv = cv2.cvtColor(out, cv2.COLOR_BGR2HSV).astype(np.float32)
        s = hsv[..., 1] / 255.0
        s = s * (sat + (1 - sat) * (1 - s) ** 2)   # tira mais onde a cor é mais carregada
        hsv[..., 1] = np.clip(255 * s, 0, 255)
        out = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    return out


def amplia(src, largura):
    """Real-ESRGAN (70 %) + Lanczos (30 %), já na largura final"""
    if src.startswith('commons:'):
        # fotos grandes: só se reduzem
        return reduz(cv2.imread(RAIZ + '/fotos-regiao/' + src[8:]), largura)
    orig = cv2.imread(SRC + src)
    h, w = orig.shape[:2]
    alt = round(h * largura / w)
    esr = cv2.imread(X4 + src.replace('/', '_').replace('.jpg', '.png'))
    esr = cv2.resize(esr, (largura, alt), interpolation=cv2.INTER_AREA)
    lan = cv2.resize(orig, (largura, alt), interpolation=cv2.INTER_LANCZOS4)
    return cv2.addWeighted(esr, 0.7, lan, 0.3, 0)


def grao(bgr, forca=3.2, semente=7):
    rng = np.random.default_rng(semente)
    g = rng.normal(0, forca, bgr.shape[:2]).astype(np.float32)
    g = cv2.GaussianBlur(g, (0, 0), 0.6)
    return np.clip(bgr.astype(np.float32) + g[..., None], 0, 255).astype(np.uint8)


def reduz(bgr, largura):
    h, w = bgr.shape[:2]
    if w <= largura:
        return bgr
    return cv2.resize(bgr, (largura, round(h * largura / w)), interpolation=cv2.INTER_AREA)


def grava(bgr, caminho, q):
    Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)).save(caminho, quality=q, optimize=True, progressive=True, subsampling=0)


out = json.load(open(RAIZ + '/scripts/imagens.json', encoding='utf-8')) if SO else {}
for src, (nome, largura, receita) in MAP.items():
    if SO and nome not in SO:
        continue
    bgr = amplia(src, largura)
    bgr = grao(trata(bgr, **receita))
    grava(bgr, f'{DST}{nome}.jpg', 90)
    tam = {'full': (bgr.shape[1], bgr.shape[0])}
    for s in (800, 1400) + MAIS.get(nome, ()):
        c = reduz(bgr, s)
        grava(c, f'{DST}{nome}-{s}.jpg', 90)
        tam[s] = (c.shape[1], c.shape[0])
    if nome in AVIF:
        for s in (800, 1400, 2000, None):
            c = reduz(bgr, s) if s else bgr
            Image.fromarray(cv2.cvtColor(c, cv2.COLOR_BGR2RGB)).save(f'{DST}{nome}{"-" + str(s) if s else ""}.avif', quality=60)
    out[nome] = {'src': src, 'receita': receita, **{str(k): v for k, v in tam.items()}}

# o hero (a foto original), a máscara do céu, o tanque original e as
# fotos das atrações (Wikimedia Commons, só recortadas e reduzidas)
import runpy
if not SO or 'tanque-original' in SO:
    runpy.run_path(RAIZ + '/scripts/hero.py')
    # o tanque vai no tamanho original (1200×1600), mas com o brilho baixado
    t = trata(cv2.imread(SRC + 'exterior/detalhe-01.jpg'), luz=LUZ)
    grava(t, DST + 'tanque-original.jpg', 92)
if not SO:
    runpy.run_path(RAIZ + '/scripts/atracoes.py')

json.dump(out, open(RAIZ + '/scripts/imagens.json', 'w', encoding='utf-8'), indent=1)
tot = sum(os.path.getsize(DST + f) for f in os.listdir(DST))
print(len(out), 'fotos,', len(os.listdir(DST)), 'ficheiros,', round(tot / 1e6, 1), 'MB')
for k, v in out.items():
    print(k, v['full'])
