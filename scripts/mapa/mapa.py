"""Desenha o mapa da secção «O vale» (SVG nas cores do site) a partir dos
dados do OpenStreetMap guardados nesta pasta, e mete-o em site/index.html
entre as marcas <!-- MAPA:inicio --> e <!-- MAPA:fim -->.

Dados (Overpass API, outubro de 2026; © OpenStreetMap, ODbL):
- rio.json        o Rio Paiva
- estradas.json   estradas primary/secondary/tertiary
- passadicos.json os Passadiços do Paiva e as pontes (516 e a do Vau)
- lugares.json    aldeias e vilas

Correr: py -I scripts/mapa/mapa.py"""
import json, math, os, re

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
HTML = RAIZ + '/site/index.html'

# janela do mapa
O, E = -8.236, -8.144
N, S = 41.0005, 40.9445
W = 1000
K = math.cos(math.radians((N + S) / 2))
H = round(W * (N - S) / ((E - O) * K))


def xy(lon, lat):
    return ((lon - O) / (E - O) * W, (N - lat) / (N - S) * H)


def dentro(p, folga=60):
    return -folga <= p[0] <= W + folga and -folga <= p[1] <= H + folga


def rdp(pts, tol):
    """simplifica uma linha (Ramer-Douglas-Peucker)"""
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    n = math.hypot(dx, dy) or 1e-9
    dmax, imax = 0, 0
    for i in range(1, len(pts) - 1):
        d = abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / n
        if d > dmax:
            dmax, imax = d, i
    if dmax > tol:
        return rdp(pts[:imax + 1], tol)[:-1] + rdp(pts[imax:], tol)
    return [pts[0], pts[-1]]


def caminho(geom, tol):
    pts = [xy(g['lon'], g['lat']) for g in geom]
    # corta os troços fora da janela, mas mantém a linha contínua
    pedacos, atual = [], []
    for p in pts:
        if dentro(p):
            atual.append(p)
        elif atual:
            pedacos.append(atual); atual = []
    if atual:
        pedacos.append(atual)
    d = ''
    for ped in pedacos:
        ped = rdp(ped, tol)
        if len(ped) < 2:
            continue
        d += 'M' + ' '.join(f'{x:.1f},{y:.1f}' for x, y in ped)
    return d


def carrega(nome):
    return json.load(open(os.path.join(AQUI, nome), encoding='utf-8'))['elements']


# ---- estradas
estradas = {'principal': [], 'outra': []}
for e in carrega('estradas.json'):
    t = e.get('tags', {})
    d = caminho(e.get('geometry', []), 1.4)
    if d:
        estradas['principal' if t.get('highway') in ('primary', 'secondary') else 'outra'].append(d)

# ---- o rio: junta os troços numa linha só, para o nome poder correr ao longo dele
rio = [caminho(e['geometry'], 1.0) for e in carrega('rio.json') if e.get('geometry')]
rio = [d for d in rio if d]

# ---- passadiços e pontes
passadicos, pontes = [], []
for e in carrega('passadicos.json'):
    t = e.get('tags', {})
    nome = t.get('name', '')
    d = caminho(e.get('geometry', []), 0.8)
    if not d:
        continue
    if nome == 'Ponte 516 Arouca' or 'suspensa' in nome.lower():   # não os parques «… - Ponte 516»
        pontes.append(d)
    elif 'Passadi' in nome and t.get('highway') in ('path', 'steps', 'footway'):
        passadicos.append(d)

# ---- aldeias (só as que não ficam por baixo de um ponto)
ALDEIAS = {'Alvarenga', 'Arouca', 'Canelas', 'Espiunca', 'Janarde', 'Moldes', 'Cabril'}
aldeias = []
for e in carrega('lugares.json'):
    nome = e.get('tags', {}).get('name')
    if nome in ALDEIAS:
        x, y = xy(e['lon'], e['lat'])
        if dentro((x, y), -20):
            aldeias.append((nome, x, y, e['tags'].get('place') == 'town'))

# ---- os pontos da lista (coordenadas do OSM; a casa: Booking e Google)
PONTOS = [
    ('casa', 'Paiva Valley', -8.17622, 40.97474),
    ('vau', 'Praia Fluvial do Vau', -8.18936, 40.97666),
    ('ponte', 'Ponte 516 Arouca', -8.17464, 40.96440),
    ('areinho', 'Passadiços · Areinho', -8.17691, 40.95291),
    ('espiunca', 'Passadiços · Espiunca', -8.21155, 40.99277),
]
# lado do rótulo de cada ponto (para não se taparem)
LADO = {'casa': 'dir', 'vau': 'esq', 'ponte': 'dir', 'areinho': 'dir', 'espiunca': 'esq'}

km = 1 / (111.32 * K) / (E - O) * W          # 1 km em unidades do mapa

svg = []
svg.append(f'<svg class="mapa-svg" viewBox="0 0 {W} {H}" role="img" aria-labelledby="mapaTitulo">')
svg.append('<title id="mapaTitulo">Mapa do vale do Paiva com a casa, a Praia Fluvial do Vau, a Ponte 516 Arouca e as duas entradas dos Passadiços do Paiva</title>')
svg.append(f'<rect class="mapa-fundo" width="{W}" height="{H}"/>')
svg.append('<g class="mapa-estradas">')
for d in estradas['outra']:
    svg.append(f'<path class="estrada" d="{d}"/>')
for d in estradas['principal']:
    svg.append(f'<path class="estrada estrada--principal" d="{d}"/>')
svg.append('</g>')
svg.append('<g class="mapa-rio">')
for d in rio:
    svg.append(f'<path class="rio" d="{d}"/>')
svg.append('</g>')
svg.append('<g class="mapa-passadicos">')
for d in passadicos:
    svg.append(f'<path class="passadico" d="{d}"/>')
for d in pontes:
    svg.append(f'<path class="ponte" d="{d}"/>')
svg.append('</g>')
# nome do rio, deitado ao longo do vale entre Canelas e Espiunca
rx, ry = xy(-8.2075, 40.9835)
svg.append(f'<text class="mapa-rio-nome" x="{rx:.0f}" y="{ry:.0f}" transform="rotate(-38 {rx:.0f} {ry:.0f})">Rio Paiva</text>')
px, py_ = xy(-8.1990, 40.9849)
svg.append(f'<text class="mapa-passadicos-nome" x="{px:.0f}" y="{py_:.0f}" text-anchor="middle" transform="rotate(-80 {px:.0f} {py_:.0f})">Passadiços do Paiva</text>')
for nome, x, y, vila in aldeias:
    svg.append(f'<text class="aldeia{" aldeia--vila" if vila else ""}" x="{x:.0f}" y="{y:.0f}">{nome}</text>')
for pid, nome, lon, lat in PONTOS:
    x, y = xy(lon, lat)
    esq = LADO[pid] == 'esq'
    tx = x - 16 if esq else x + 16
    anc = 'end' if esq else 'start'
    if pid == 'casa':
        svg.append(f'<g class="ponto ponto--casa" data-poi="casa" transform="translate({x:.1f} {y:.1f})">'
                   '<circle class="ponto__halo" r="30"/><circle class="ponto__base" r="19"/>'
                   '<use href="#serras" x="-11" y="-7.5" width="22" height="13" class="ponto__serras"/>'
                   f'<text class="ponto__nome" x="28" y="6">{nome}</text></g>')
    else:
        svg.append(f'<g class="ponto" data-poi="{pid}" transform="translate({x:.1f} {y:.1f})">'
                   '<circle class="ponto__halo" r="18"/><circle class="ponto__base" r="6.5"/>'
                   f'<text class="ponto__nome" x="{tx - x:.0f}" y="5" text-anchor="{anc}">{nome}</text></g>')
# o aeroporto fica fora do mapa, para noroeste: uma seta na margem
svg.append('<g class="ponto ponto--fora" data-poi="aeroporto" transform="translate(34 34)">'
           '<path class="seta" d="M14 14 0 0M0 0h9M0 0v9"/><text class="ponto__nome" x="20" y="6">Aeroporto do Porto</text></g>')
# escala de 1 km e norte
sx, sy = W - 40 - km, H - 34
svg.append(f'<g class="mapa-escala"><path d="M{sx:.1f},{sy}v-6M{sx:.1f},{sy}h{km:.1f}v-6"/><text x="{sx:.1f}" y="{sy + 18}">0</text><text x="{sx + km:.1f}" y="{sy + 18}" text-anchor="end">1 km</text></g>')
svg.append(f'<g class="mapa-norte" transform="translate({W - 40} 46)"><path d="M0 -18 7 8 0 3 -7 8Z"/><text y="26" text-anchor="middle">N</text></g>')
svg.append(f'<text class="mapa-credito" x="16" y="{H - 14}">© OpenStreetMap</text>')
svg.append('</svg>')
out = '\n'.join(svg)

html = open(HTML, encoding='utf-8').read()
novo, n = re.subn(r'(<!-- MAPA:inicio -->).*?(<!-- MAPA:fim -->)', lambda m: m.group(1) + '\n' + out + '\n' + m.group(2), html, flags=re.S)
if n != 1:
    raise SystemExit('marcas MAPA não encontradas em index.html')
open(HTML, 'w', encoding='utf-8').write(novo)
print(f'mapa {W}x{H}, {len(out) // 1024} KB; estradas {sum(map(len, estradas.values()))}, rio {len(rio)}, passadiços {len(passadicos)}, pontes {len(pontes)}, aldeias {len(aldeias)}')
