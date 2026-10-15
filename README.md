# Paiva Valley — versão base

Site do Paiva Valley (Alojamento Local, moradia, RNAL 146359/AL), em Lourido,
Alvarenga (Arouca): casas de pedra com telhado de lousa numa encosta do vale do
Paiva, três quartos (Paiva, Vau, Arainho) para até 6 hóspedes. Versão base de
demonstração (outubro de 2026), curta de propósito.

Letra: Source Serif 4, leve, nos títulos e Hanken Grotesk no texto. O nome
do hero é Hanken Grotesk pesado, em maiúsculas, com o branco a esbater-se
para baixo, como o da Casa da Gueira (pedido do cliente na 3.ª ronda, que
achou a Bodoni Moda da 1.ª versão pouco elegante e grande demais). A paleta vem da marca e da casa:
o verde-musgo do logótipo, o verde-salva do fundo do logótipo e da serra, o
granito claro, a madeira da pérgola e a lousa dos telhados.

Os gestos desta casa:
- **o hero**: a foto panorâmica que o Eduardo mandou (3168×1344, no ficheiro
  original, sem recompressão nem tamanhos reduzidos). O nome «PAIVA VALLEY»
  está entre a foto e a serra: ao abrir, nasce por trás da cumeada, letra a
  letra, a passar de desfocado a nítido; ao descer, volta a pôr-se atrás
  dela. A serra é a mesma foto com a máscara do céu. O tamanho e o lugar do
  nome são calculados em cada ecrã, para caberem no céu (`main.js`, "HERO").
- **a casa**: o texto fica preso à esquerda e a legenda muda com a foto que
  está à vista; as fotos das casas entram com um corte inclinado, como a
  água de um telhado de lousa (`main.js`, "CASA").
- **o exterior**: poucos espaços, em grande. O Terreiro Nobre num palco
  preso: a moldura abre-se de uma fresta (como o espaço entre dois pilares
  da pérgola) até ao quadrado inteiro, sem zoom, e depois a mesa comprida
  sobe por cima do canto (`main.js`, "TERREIRO"). A seguir o Ritmo numa
  fila e o tanque grande, que se abre de baixo para cima.
- **os quartos**: painel preso ao estilo do 145 Townhouse, com a coluna cor
  de musgo (título «Quartos», nome em duas linhas, separadores com barra) e
  as seis fotos a trocar com o scroll, numa cortina de bordo macio
  (`main.js`, "QUARTOS").
- **a quebra da janela**: a serra vista de uma janela abre-se do meio para os
  lados, com uma frase sobre o Paiva.
- **a região**: a faixa da serra no nevoeiro abre-se do meio para fora, com
  «O VALE DO PAIVA» na mesma letra do hero; as fotos do rio numa fita que
  anda sozinha, pára com o rato, se arrasta e abre o visor (`main.js`,
  "FITA").

Das referências ficaram ideias, não peças:
- Gueira: a frase de abertura ao centro e os números.
- Malhada: o vale do Paiva à porta e as vozes na língua original.
- Avós: os quartos lado a lado com os factos curtos.
- Tília e Trebid'Ouro: o fecho com a foto a ecrã inteiro, o rodapé legal e o
  botão «Como chegar».
- Quinta das Donas (sitequintadasdonas.netlify.app, 2026-10-10):
  - o mapa desenhado com a lista de destinos, em que escolher um destino
    acende-o no mapa;
  - as comodidades com ícone e a lista toda numa folha que se abre;
  - o «Antes de chegar» com ícones;
  - a barra de reserva fixa no telemóvel;
  - os separadores no visor de fotografias.
  Ficaram de fora: a faixa de texto a correr (a pausa já faz esse papel), a
  galeria inteira na página (as fotos são fracas para se verem todas de
  seguida), os arcos dos quartos (já usados nas Casas dos Avós) e o WhatsApp,
  porque não está confirmado que a casa o use.

## Pastas

- `site/` — o site (HTML, CSS e JS, sem build). É a pasta que a Netlify publica.
  - `mascara.css` — a máscara do céu, embutida (gerada; ver abaixo).
- `netlify.toml` — configuração da Netlify.
- `fotos-dono/` — fotos mandadas pelo Eduardo/dono, no original:
  `hero-vale-paiva.jpg` (o hero).
- `scripts/hero.py` — copia o hero e o tanque (o original do Google) para
  `site/assets/img/` tal e qual, gera a máscara do céu (`hero-mascara.png`
  e `mascara.css`) e imprime a `CUMEADA` para o `main.js`. O `imagens.py`
  corre-o no fim (apaga a pasta das imagens antes de as gerar).
- `scripts/imagens.py` — prepara as fotos (`py -I scripts/imagens.py`).
  Precisa do OpenCV.
- `scripts/mapa/` — o mapa da secção «O vale». O `mapa.py` desenha o SVG a
  partir dos dados do OpenStreetMap guardados na pasta (o rio, as estradas,
  os Passadiços, as pontes e as aldeias, descarregados pela Overpass API em
  outubro de 2026) e mete-o no `index.html`, entre as marcas
  `<!-- MAPA:inicio -->` e `<!-- MAPA:fim -->`. Correr com
  `py -I scripts/mapa/mapa.py`. O crédito «© OpenStreetMap» é obrigatório
  (licença ODbL) e está no canto do mapa.
- `fotos-regiao/` — as fotos grandes das três atrações (Praia do Vau, Ponte
  516, Passadiços), originais do Wikimedia Commons (Vitor Oliveira, CC BY-SA
  2.0; Jorge Marto, CC BY-SA 4.0; dados em `creditos.json`). O
  `scripts/atracoes.py` recorta-as em 4:5 e reduz, sem mais nada. O crédito
  está só no rodapé.
- `arquivo/` — versões anteriores do site.
- `fotos-ampliadas/x4/` — as fotos do dossiê ampliadas ×4 pelo Real-ESRGAN.
  Ver o `LEIA-ME.md` da pasta.
- `dossie/` — o dossiê da casa. O que o site pode afirmar está em
  `dossie/site-pronto.md`.

## As fotos (o problema principal)

As fotos que a casa publica são pequenas: quase todas são quadrados de 600 px,
e a maior horizontal (a do hero) tem 1024 px. Para a demonstração foram
ampliadas ×4 com o Real-ESRGAN. O `imagens.py` mistura essa ampliação (70 %)
com uma ampliação simples (30 %), para não parecerem pintadas, acalma as
cores do telemóvel e põe um grão leve. Ao perto ainda se nota (folhagem
lisa, pedra um pouco plástica). **Pedir ao dono os originais do telemóvel**
(os nomes `IMG_0244…IMG_4869` indicam que existem) e trocar a fonte no
`MAP` do `imagens.py`.

A máscara do céu do hero e a linha da serra (`CUMEADA` em `main.js`) saem da
foto do hero. Se o hero mudar de foto, trocar o ficheiro em `fotos-dono/`,
correr `py -I scripts/hero.py` e colar a `CUMEADA` que ele imprime no
`main.js` (e a proporção em `FOTO`). A máscara vai embutida em
`mascara.css` porque, quando o site é aberto do disco (`file://`), o browser
bloqueia uma `mask-image` noutro ficheiro, e a serra tapava o nome todo.

## Secções

1. **Hero**: a foto panorâmica do Eduardo (as duas casas, a pérgola e o
   vale); só o nome, «Lourido · Alvarenga · Arouca» e «Reservar» com
   contorno.
2. **A casa** (o exterior das casas): a frase de abertura, o texto dos
   anfitriões assinado «Telmo e Sofia, anfitriões» e uma só foto, a do
   caminho de lajes (fachada-02). Carregar nela abre o visor «Exterior»
   (7 fotos).
3. **Quartos**: Paiva, Vau e Arainho num painel preso; o scroll passa pelas
   duas fotos de cada quarto (a casa não publica mais). Carregar na foto
   abre só esse quarto no visor.
4. **Espaços comuns**: o Segredo (sala comum) e a cozinha partilhada.
5. **Comodidades**: como na Boa Nova, uma faixa cor de musgo com o título
   ao centro e uma fila de 11 cartões (ícone, nome, nota) que anda sozinha,
   pára com o rato e se arrasta.
6. **Galeria** (ideia da Boa Vida, no estilo deste site): o título e os
   separadores Tudo, Exterior, Vistas, Pormenores, Quartos e Espaços
   comuns, com um filete que desliza para o escolhido; por baixo, uma fila
   de fotos no formato original, à mesma altura, que se arrasta para o lado,
   com um filete de posição. Cada foto abre o visor na série do seu espaço
   (23 fotos; as séries estão em `SERIES`, no main.js).
7. **A região**: a faixa do nevoeiro com o título; três atrações (Praia do
   Vau a 5 minutos, a da casa; Ponte 516 a 3,8 km e Passadiços-Areinho a
   8,9 km, do Booking); a fita com 8 fotos do rio que a casa publica; o
   mapa desenhado com a lista de destinos e o «Para chegar bem».
8. **Reservar**: as mesas debaixo da pérgola, viradas ao vale
   (refeicoes-04), «Antes de chegar», o
   pedido por email, o Booking e os telefones.

As opiniões dos hóspedes saíram do site na 3.ª ronda, a pedido do cliente.
A versão anterior está em `arquivo/v2-donas/`.

No telemóvel, depois do hero, há uma barra fixa em baixo com «Ver datas no
Booking» e «Ligar», que se esconde no fecho. O visor de fotografias tem
separadores (Lá fora, Lá dentro, O vale) para mudar de série sem o fechar.

O visor tem separadores (A casa, Exterior, Quartos, Comuns, O vale) e
carrega sempre o ficheiro maior de cada foto, sem a mostrar maior do que ela
é.

## Rondas

- **4.ª ronda (2026-10-14)**: hero com a foto panorâmica do Eduardo; o
  exterior deixou a grelha (bento) e passou a poucos espaços em grande, com
  o Terreiro Nobre a abrir-se num palco preso; o tanque maior, no original;
  os quartos num painel preso com as seis fotos a trocar com o scroll; a
  foto da janela saiu de «Lá dentro» e passou a quebra com uma frase do
  Paiva; «Espaços comuns» identificados; a fita do rio passou a andar
  sozinha, a parar com o rato e a arrastar-se (antes corria só com o scroll
  e era difícil de clicar). Nomes das secções: Exterior, Quartos, Espaços
  comuns. Fotos de cantos retos. A versão anterior está em
  `arquivo/v3-2026-10-14/`.
- **5.ª ronda (2026-10-14)**: o nome do hero passou para o centro da foto,
  maior (~12,6vw), com a localização por baixo; saiu a camada da serra
  (mascara.css deixou de ser usado) e o botão do hero passou a cheio. No
  exterior, o título passou a «À sombra da pérgola, com o vale aos pés»; a
  mesa pequena por cima do Terreiro saiu: a foto da mesa comprida sobe agora
  por cima da do vale, na mesma moldura, com o scroll. «Ritmo» passou a
  «O deck», com entrada (abre-se da esquerda para a direita) e saída (sobe
  e esvai-se) ligadas ao scroll. Saiu do visor a segunda foto do deck
  (ritmo-sofas, quase igual). A versão anterior está em
  `arquivo/v4-2026-10-14/`. Depois, as fotos das três atrações foram
  trocadas: a da praia era uma foto da casa de 600 px ampliada, e a ponte e
  os passadiços eram fotos deitadas cortadas ao alto. Agora são fotos
  grandes, ao alto, do Wikimedia Commons, recortadas em 4:5 sem
  tratamento (`scripts/atracoes.py`).
  As fotos de fora da casa (secções «A casa» e «Exterior» e o visor)
  tinham brilho a mais: o tratamento deixou de clarear as sombras e passou
  a baixar o meio e as altas luzes (`LUZ` no `imagens.py`; o tanque
  original também). Na «A casa», as quatro fotos passaram a quadradas,
  inteiras (antes eram cortadas em 3:2 e 4:5, com zoom); quem anda com o
  scroll é a moldura. Fotos em JPEG 90, cor 4:4:4. `py -I scripts/imagens.py
  nome1 nome2` refaz só essas fotos. A foto do fecho (a casa no nevoeiro,
  vista-02) repetia o nevoeiro da faixa da região: passou a ser a das mesas
  debaixo da pérgola (refeicoes-04), que antes só aparecia no visor.
- **6.ª ronda (2026-10-14)**: menos secções («demasiadas secções que não
  acrescentam nada e dão ar de IA»). «A casa» ficou com uma só foto, que
  abre o exterior no visor; a secção «Exterior» (Terreiro Nobre preso, o
  deck, o tanque) e a quebra da janela depois dos quartos saíram. As fotos
  delas passaram para «Pormenores e vistas», uma fila mais no fundo. «Na
  casa» passou a «Comodidades», com a fila da Boa Nova; saíram os números
  3 · 3 · 6 (estão no fecho) e a folha «Ver tudo · 23». A versão anterior
  está em `arquivo/v5-2026-10-14/`. Depois, «Pormenores e vistas» passou a
  galeria com separadores (ideia de sitealojamentosboavida.netlify.app):
  escolhe-se o espaço sem abrir as fotos; o visor ganhou «Vistas» e
  «Pormenores»; o menu ganhou «Galeria».

O site não mostra preços nem notas. A nota do Booking está em 7,3 e a descer,
e o site atual tem duas tabelas de preços diferentes.

## Antes de publicar (com o dono)

- Autorização para usar as fotos e os **originais em tamanho grande**.
- **O Segredo**: o site mostra-o com a foto da sala (como o cartão
  «Segredo» do site atual). O ficheiro da casinha de pedra solta (fachada-01)
  também se chama `segredo.jpg`: confirmar se o Segredo é a sala dessa casa.
- **O tanque** (pormenor): a casa não diz onde fica. A legenda só descreve
  a foto.
- Fotos de terceiros: as da Ponte 516 e dos Passadiços são CC BY 2.0 e
  pedem o crédito. Se o dono tiver fotos suas destes sítios, trocar.
- **«Para chegar bem»**: o texto foi escrito a partir das queixas dos hóspedes
  (7 de 17 reviews com texto falam do caminho). Confirmar o texto com o dono
  e pedir-lhe um ponto de GPS certo para a entrada. O botão «Como chegar» usa
  as coordenadas do Booking e do Google, e os hóspedes contam que o Google
  Maps leva ao caminho errado.
- **As distâncias do mapa**: o Booking dá 3,8 km até à Ponte 516, mas no
  mapa a ponte parece mais perto, porque de carro é preciso contornar o
  vale. Confirmar com o dono os tempos de carro (e se à praia se vai a pé).
- A videovigilância no exterior (Booking): confirmar que o dono a quer na
  lista. Se a houver, a lei obriga a avisá-la de qualquer forma.
- O email a publicar: o site atual usa geral@paivavalley.com e o RNT usa
  paivavalley.geral@gmail.com.
- Se o Arainho também tem ar condicionado e TV (o site não o diz por agora).
- Que quarto não tem janela (uma review de 2025). O site não promete janelas
  nem vista em todos os quartos.
- A foto da janela (vista-04) é a quebra antes dos espaços comuns: falta
  saber de que divisão é.
- O domínio final (para o `canonical`, as `og:` absolutas e o `sitemap.xml`,
  que ainda não existem).
- Ficou de fora de propósito:
  - os preços;
  - os eventos no Terreiro Nobre (o Booking proíbe);
  - o forno a lenha, os trilhos a partir da casa e o transporte do aeroporto
    (sem prova);
  - o «4 pessoas» do quarto Paiva (o Booking diz 2);
  - o texto do tema de demonstração do site atual.

## Ver localmente

```
cd site
py -m http.server 8741
```
e abrir http://localhost:8741/ (também abre diretamente do disco).

Depois de mexer no CSS ou no JS, subir o `?v=N` em `site/index.html`.
