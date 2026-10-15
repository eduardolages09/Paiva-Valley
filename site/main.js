/* Paiva Valley — versão base. Um IIFE só, sem dependências (o Lenis, se
   carregar, só dá o scroll suave). */
(function () {
  'use strict';

  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var limita = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var medio = window.matchMedia('(min-width: 701px)');

  /* ---------- SCROLL SUAVE (Lenis) ---------- */
  var lenis = null;
  if (!reduz && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
    var corre = function (t) { lenis.raf(t); requestAnimationFrame(corre); };
    requestAnimationFrame(corre);
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var alvo = a.getAttribute('href');
      if (alvo.length < 2 || !$(alvo)) return;
      fechaMenu();
      if (!lenis) return;
      e.preventDefault();
      lenis.scrollTo(alvo, { offset: alvo === '#inicio' ? 0 : -10 });
    });
  });

  /* ---------- HERO: o nome grande, ao centro da foto ----------
     O CSS centra o nome e dá-lhe o tamanho; aqui só se escolhe o lugar da
     foto (object-position): a foto é mais larga do que quase todos os
     ecrãs e, ao alto, mostra as duas casas. */
  var hero = $('.hero');
  var heroImg = $('#heroImg');

  function posicionaNome() {
    var retrato = hero.clientWidth / hero.clientHeight < 0.8;
    hero.style.setProperty('--hx', (retrato ? 30 : 50) + '%');
    hero.style.setProperty('--hy', '70%');
    hero.classList.add('is-medido');
  }

  var abriu = false;
  var podeAbrir = 0;
  var abreHero = function () {
    if (abriu || ++podeAbrir < 2) return;      // precisa da foto e da letra
    abriu = true;
    requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('is-pronto'); }); });
  };
  var letra = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  var tempoLetra = new Promise(function (ok) { setTimeout(ok, 1800); });
  Promise.race([letra, tempoLetra]).then(function () { posicionaNome(); abreHero(); });
  if (reduz) { podeAbrir = 1; }
  else if (heroImg.complete && heroImg.naturalWidth) abreHero();
  else {
    heroImg.addEventListener('load', abreHero, { once: true });
    setTimeout(function () { if (!abriu) { podeAbrir = 1; abreHero(); } }, 2600);
  }
  // se a letra chegar depois da medida, mede outra vez
  if (document.fonts) document.fonts.addEventListener('loadingdone', posicionaNome);

  /* ---------- TOPO e menu ---------- */
  var topo = $('#topo');
  var menu = $('#menu');
  var cta = $('#barra');
  var ultimoY = 0;
  function fechaMenu() {
    if (!topo.classList.contains('menu-aberto')) return;
    topo.classList.remove('menu-aberto');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Abrir o menu');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
  }
  menu.addEventListener('click', function () {
    if (topo.classList.contains('menu-aberto')) return fechaMenu();
    topo.classList.remove('is-escondido');
    topo.classList.add('menu-aberto');
    menu.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-label', 'Fechar o menu');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechaMenu(); });

  function topoNoScroll(y) {
    var h = hero.offsetHeight;
    topo.classList.toggle('is-solido', y > 60);
    if (!topo.classList.contains('menu-aberto')) {
      if (y > h && y > ultimoY + 4) topo.classList.add('is-escondido');
      else if (y < ultimoY - 4 || y <= h) topo.classList.remove('is-escondido');
    }
    var fim = $('#reservar').getBoundingClientRect().top < innerHeight * .7;
    cta.classList.toggle('is-visivel', y > h * .8 && !fim);
    ultimoY = y;
  }

  /* ---------- REVELAÇÕES (e os números que contam) ---------- */
  function conta(el) {
    var fim = +el.getAttribute('data-conta');
    if (reduz) return;
    var t0 = null;
    var passo = function (t) {
      if (!t0) t0 = t;
      var k = limita((t - t0) / 1300, 0, 1);
      el.textContent = Math.round(fim * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(passo);
    };
    el.textContent = '0';
    requestAnimationFrame(passo);
  }
  var vigia = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-visivel');
      $$('[data-conta]', e.target).forEach(conta);
      vigia.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  $$('[data-revela], [data-moldura], .cf, .atracoes, .galeria__fita').forEach(function (el) {
    if (reduz) el.classList.add('is-visivel'); else vigia.observe(el);
  });

  /* ---------- O QUE SE MEXE COM O SCROLL ----------
     HERO: --hs de 0 a 1 enquanto o hero sai. MEXE: as fotos com data-mexe
     correm devagar dentro da moldura (--m de -1 a 1). REGIÃO: --pa de 1 (a
     faixa fechada numa linha) a 0 (aberta). Os outros palcos têm o seu
     bloco a seguir. */
  var mexem = $$('[data-mexe]');
  var faixa = $('#regiaoFaixa');
  var suave = function (t) { return t * t * (3 - 2 * t); };
  var entre = function (v, a, b) { return limita((v - a) / (b - a), 0, 1); };

  // -1 quando o elemento entra por baixo, 1 quando sai por cima
  function passagem(el) {
    var r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return null;
    return limita(((innerHeight - r.top) / (innerHeight + r.height)) * 2 - 1, -1, 1);
  }

  /* QUARTOS: painel preso; o scroll passa pelas seis fotos, 85vh por foto.
     f vai de 0 a 5 (a foto que se vê). Cada foto fica parada e inteira
     metade do passo; na outra metade a seguinte sobe por cima, numa
     cortina de bordo macio (--r de 0 a 1), e a de baixo escurece um pouco
     (--s). O nome do quarto e a barra dos separadores seguem a foto. */
  var palcoQ = $('#quartosPalco');
  var fotosQ = $$('.qf', palcoQ);
  var nomesQ = $$('.qnome', palcoQ);
  var abasQ = $$('.quartos__abas button', palcoQ);
  var FAIXAS = [[0, 1.75], [1.75, 3.75], [3.75, 5]];
  var quartoAtual = -1;
  function fQuartos(p) { return limita(p * 5.6 - 0.3, 0, 5); }
  function palcoQuartos() {
    var r = palcoQ.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    var total = r.height - innerHeight;
    var f = fQuartos(limita(-r.top / total, 0, 1));
    var topo = 0;
    fotosQ.forEach(function (el, i) {
      var v = i === 0 ? 1 : suave(entre(f - (i - 1), 0.5, 1));
      var seg = i + 1 < fotosQ.length ? suave(entre(f - i, 0.5, 1)) : 0;
      if (i > 0) el.style.setProperty('--r', v.toFixed(4));
      el.style.setProperty('--s', seg.toFixed(4));
      el.classList.toggle('is-fora', v <= 0);
      el.style.pointerEvents = v >= 0.5 ? '' : 'none';
      if (v >= 0.5) topo = i;
    });
    var q = Math.floor(topo / 2);
    abasQ.forEach(function (b, k) {
      b.querySelector('i').style.setProperty('--b', entre(f, FAIXAS[k][0], FAIXAS[k][1]).toFixed(4));
    });
    if (q === quartoAtual) return;
    quartoAtual = q;
    nomesQ.forEach(function (n, k) {
      n.classList.toggle('is-atual', k === q);
      n.classList.toggle('is-passado', k < q);
      n.setAttribute('aria-hidden', k === q ? 'false' : 'true');
    });
    abasQ.forEach(function (b, k) { b.classList.toggle('is-atual', k === q); b.setAttribute('aria-current', k === q ? 'true' : 'false'); });
  }
  // os separadores levam o scroll até à primeira foto desse quarto
  abasQ.forEach(function (b, k) {
    b.addEventListener('click', function () {
      var total = palcoQ.offsetHeight - innerHeight;
      var y = palcoQ.getBoundingClientRect().top + window.scrollY + ((2 * k + 0.3 + (k ? 0.05 : 0)) / 5.6) * total;
      if (lenis) lenis.scrollTo(y, { duration: 1.6 }); else window.scrollTo({ top: y, behavior: reduz ? 'auto' : 'smooth' });
    });
  });

  var yAntes = window.scrollY;
  function palcos() {
    var y = window.scrollY;
    if (!reduz) {
      hero.style.setProperty('--hs', limita(y / hero.offsetHeight, 0, 1).toFixed(4));
      mexem.forEach(function (el) {
        var k = passagem(el);
        if (k !== null) el.style.setProperty('--m', k.toFixed(4));
      });
      // REGIÃO: a faixa do nevoeiro abre-se do meio para fora
      var rf = faixa.getBoundingClientRect();
      faixa.style.setProperty('--pa', limita((rf.top - innerHeight * 0.18) / (innerHeight * 0.7), 0, 1).toFixed(4));
      fitaBalanco(y - yAntes);
    }
    palcoQuartos();
    topoNoScroll(y);
    yAntes = y;
  }

  /* ---------- FITA: as fotos do rio ----------
     No computador anda sozinha, devagar, e o scroll dá-lhe balanço. Com o
     rato por cima (ou uma foto com o foco) pára, para se poder carregar com
     calma; arrasta-se com o rato e, se se arrastou, o clique não abre o
     visor. As fotos estão duas vezes seguidas para a volta não ter fim.
     No telemóvel é uma fila que se desliza com o dedo (CSS). */
  var fita = $('#fita'), pista = $('#fitaPista');
  var fx = 0, fvel = 0, fpara = false, fvista = false, fvolta = 0, fultimo = 0;
  var arrasto = null, arrastou = false;
  var FITA_VEL = 26;                       // px por segundo, sozinha
  function fitaBalanco(dy) {
    if (!fvista || fpara || arrasto || !medio.matches) return;
    fvel += limita(dy, -120, 120) * 0.9;
  }
  function fitaMede() { var c = pista.querySelector('.is-copia'); fvolta = c ? c.offsetLeft - pista.children[0].offsetLeft : 0; }
  function fitaPoe() {
    if (fvolta) { fx = ((fx % fvolta) - fvolta) % fvolta; }
    pista.style.setProperty('--fx', fx.toFixed(1) + 'px');
  }
  function fitaCorre(t) {
    var dt = fultimo ? Math.min(0.05, (t - fultimo) / 1000) : 0;
    fultimo = t;
    if (!arrasto) {
      var alvo = (fpara || reduz) ? 0 : FITA_VEL;
      fx -= alvo * dt + fvel * dt;
      fvel *= Math.pow(0.04, dt);          // o balanço do scroll e do arrasto acalma
      if (Math.abs(fvel) < 0.5) fvel = 0;
      fitaPoe();
    }
    if (fvista) requestAnimationFrame(fitaCorre); else fultimo = 0;
  }
  if (medio.matches) {
    Array.prototype.slice.call(pista.children).forEach(function (li) {
      var c = li.cloneNode(true);
      c.classList.add('is-copia');
      c.setAttribute('aria-hidden', 'true');
      $$('button', c).forEach(function (b) { b.tabIndex = -1; });
      pista.appendChild(c);
    });
    fitaMede();
    window.addEventListener('resize', fitaMede);
    new IntersectionObserver(function (es) {
      var antes = fvista;
      fvista = es[0].isIntersecting;
      if (fvista && !antes) requestAnimationFrame(fitaCorre);
    }).observe(fita);
    pista.addEventListener('mouseenter', function () { fpara = true; });
    pista.addEventListener('mouseleave', function () { fpara = false; });
    pista.addEventListener('focusin', function () { fpara = true; });
    pista.addEventListener('focusout', function () { fpara = false; });
    pista.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      arrasto = { x: e.clientX, fx: fx, t: performance.now(), ux: e.clientX, v: 0, id: e.pointerId };
      arrastou = false;
    });
    pista.addEventListener('pointermove', function (e) {
      if (!arrasto || e.pointerId !== arrasto.id) return;
      var dx = e.clientX - arrasto.x;
      if (!arrastou && Math.abs(dx) > 6) {
        arrastou = true;
        pista.classList.add('is-arrasto');
        try { pista.setPointerCapture(e.pointerId); } catch (_) {}
      }
      if (!arrastou) return;
      var agora = performance.now();
      arrasto.v = (e.clientX - arrasto.ux) / Math.max(1, agora - arrasto.t) * 1000;
      arrasto.ux = e.clientX; arrasto.t = agora;
      fx = arrasto.fx + dx;
      fitaPoe();
    });
    var largaFita = function (e) {
      if (!arrasto || (e && e.pointerId !== arrasto.id)) return;
      if (arrastou) fvel = -limita(arrasto.v, -2400, 2400);   // continua com o embalo
      arrasto = null;
      pista.classList.remove('is-arrasto');
    };
    pista.addEventListener('pointerup', largaFita);
    pista.addEventListener('pointercancel', largaFita);
    // depois de arrastar, o clique não abre o visor
    pista.addEventListener('click', function (e) {
      if (!arrastou) return;
      e.preventDefault(); e.stopPropagation(); arrastou = false;
    }, true);
    pista.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }

  var pedido = false;
  var agenda = function () {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame(function () { pedido = false; palcos(); });
  };
  if (lenis) lenis.on('scroll', agenda);
  window.addEventListener('scroll', agenda, { passive: true });
  var medeDepois = null;
  window.addEventListener('resize', function () {
    agenda();
    clearTimeout(medeDepois);
    medeDepois = setTimeout(posicionaNome, 120);
  });
  palcos();

  /* ---------- VISOR ----------
     Cada série é uma lista de [nome da foto, legenda]. Os nomes são os de
     assets/img (scripts/imagens.py). */
  var QUARTOS = [
    ['paiva-1', 'Quarto Paiva: duas camas individuais'],
    ['paiva-2', 'Quarto Paiva, com o sofá-cama'],
    ['vau-1', 'Quarto Vau: cama de casal'],
    ['vau-2', 'Quarto Vau e a parede de pedra'],
    ['arainho-1', 'Quarto Arainho: cama de casal'],
    ['arainho-2', 'Quarto Arainho e o roupeiro']
  ];
  var SERIES = {
    // a única foto de «A casa» abre o exterior; as séries servem também a galeria
    casa: { titulo: 'Exterior', fotos: [
      ['casa-caminho', 'Uma das casas, ao fundo do caminho de lajes'],
      ['casas-muro', 'As casas, no alto de um muro de pedra seca'],
      ['casa-anoitecer', 'Ao anoitecer, com as luzes acesas'],
      ['hero-vale', 'As casas de pedra, a pérgola e o vale'],
      ['escadas-pergola', 'As escadas de madeira até à pérgola'],
      ['arvore-pergola', 'O terreno, com penedos e a pérgola ao fundo'],
      ['terreiro-mesas', 'As mesas de piquenique debaixo da pérgola']
    ] },
    vistas: { titulo: 'Vistas', fotos: [
      ['terreiro-vale', 'O Terreiro Nobre: a pérgola sobre o vale'],
      ['ritmo-deck', 'O deck com sofás, virado ao vale'],
      ['janela-serra', 'A serra, vista de uma janela da casa'],
      ['casa-nevoeiro', 'A casa e a pérgola, com nevoeiro na serra']
    ] },
    pormenores: { titulo: 'Pormenores', fotos: [
      ['tanque-original', 'Um tanque de água com um fuso de ferro antigo'],
      ['casa-pedra', 'Pedra solta e telhado de lousa'],
      ['muro-pedra', 'Um muro de pedra seca do terreno'],
      ['terreiro-mesa-posta', 'A mesa comprida, posta debaixo da pérgola']
    ] },
    // cada quarto abre só as suas fotos; o separador «Quartos» do visor mostra os três
    quartos: { titulo: 'Quartos', fotos: QUARTOS },
    paiva: { titulo: 'Quartos', grupo: 'quartos', fotos: QUARTOS.slice(0, 2) },
    vau: { titulo: 'Quartos', grupo: 'quartos', fotos: QUARTOS.slice(2, 4) },
    arainho: { titulo: 'Quartos', grupo: 'quartos', fotos: QUARTOS.slice(4, 6) },
    comuns: { titulo: 'Espaços comuns', fotos: [
      ['segredo-sala', 'O Segredo: a sala comum'],
      ['cozinha', 'A cozinha partilhada']
    ] },
    vale: { titulo: 'O vale', fotos: [
      ['atr-vau', 'A Praia Fluvial do Vau'],
      ['atr-ponte', 'A Ponte 516 Arouca'],
      ['atr-passadicos', 'Os Passadiços do Paiva'],
      ['rio-tronco', 'O rio, visto por entre as árvores'],
      ['rio-largo', 'O rio largo e calmo'],
      ['cascata', 'Uma cascata entre os penedos'],
      ['rio-ponte', 'O rio e uma ponte suspensa pequena'],
      ['vale-alto', 'O vale do rio, visto de cima'],
      ['rio-rapidos', 'O rio com rápidos, entre as árvores'],
      ['sobreiros', 'Sobreiros numa encosta com fetos'],
      ['rio-encostas', 'O rio entre as encostas']
    ] }
  };
  // a miniatura de cada foto (o original do tanque não tem tamanhos)
  function mini(n) { return 'assets/img/' + (n === 'tanque-original' ? 'tanque' : n) + '-800.jpg'; }

  var visor = $('#visor');
  var vImg = $('#visorImg');
  var vTitulo = $('#visorTitulo');
  var vConta = $('#visorConta');
  var vLegenda = $('#visorLegenda');
  var vFita = $('#visorFita');
  var serie = null, atual = 0, origem = null;
  // separadores do visor: trocar de série sem fechar
  var abasV = $$('.visor__abas button');
  abasV.forEach(function (b) {
    b.addEventListener('click', function () {
      var n = b.getAttribute('data-aba');
      if (SERIES[n] && SERIES[n] !== serie) abreVisor(n, SERIES[n].fotos[0][0], origem);
    });
  });

  function mostra(i, sem) {
    var f = serie.fotos;
    atual = (i + f.length) % f.length;
    var n = f[atual][0];
    var troca = function () {
      vImg.src = 'assets/img/' + n + '.jpg';
      vImg.alt = f[atual][1];
      vImg.classList.remove('is-a-trocar');
    };
    if (sem) troca(); else { vImg.classList.add('is-a-trocar'); setTimeout(troca, 180); }
    vConta.textContent = (atual + 1) + ' / ' + f.length;
    vLegenda.textContent = f[atual][1];
    $$('button', vFita).forEach(function (b, k) {
      b.classList.toggle('is-atual', k === atual);
      if (k === atual) b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: sem ? 'auto' : 'smooth' });
    });
  }
  function abreVisor(nomeSerie, foto, de) {
    serie = SERIES[nomeSerie];
    if (!serie) return;
    origem = de;
    vTitulo.textContent = serie.titulo;
    var grupo = serie.grupo || nomeSerie;
    abasV.forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-aba') === grupo ? 'true' : 'false'); });
    vFita.innerHTML = '';
    serie.fotos.forEach(function (f, k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Fotografia ' + (k + 1) + ': ' + f[1]);
      b.innerHTML = '<img src="' + mini(f[0]) + '" alt="" loading="lazy">';
      b.addEventListener('click', function () { mostra(k); });
      vFita.appendChild(b);
    });
    var i = 0;
    serie.fotos.forEach(function (f, k) { if (f[0] === foto) i = k; });
    visor.hidden = false;
    visor.classList.add('is-a-abrir');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    mostra(i, true);
    $('#visorFechar').focus();
  }
  function fechaVisor() {
    visor.hidden = true;
    visor.classList.remove('is-a-abrir');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
    if (origem && origem.isConnected) origem.focus({ preventScroll: true });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-serie]');
    if (!b || visor.contains(b)) return;
    abreVisor(b.getAttribute('data-serie'), b.getAttribute('data-foto'), b);
  });
  $('#visorFechar').addEventListener('click', fechaVisor);
  $('#visorAnt').addEventListener('click', function () { mostra(atual - 1); });
  $('#visorSeg').addEventListener('click', function () { mostra(atual + 1); });
  visor.addEventListener('click', function (e) { if (e.target === visor || e.target.id === 'visorPalco') fechaVisor(); });
  document.addEventListener('keydown', function (e) {
    if (visor.hidden) return;
    if (e.key === 'Escape') fechaVisor();
    else if (e.key === 'ArrowLeft') mostra(atual - 1);
    else if (e.key === 'ArrowRight') mostra(atual + 1);
    else if (e.key === 'Tab') {
      // o foco não sai do visor
      var foc = $$('button', visor).filter(function (b) { return b.offsetParent !== null; });
      var p = foc[0], u = foc[foc.length - 1];
      if (e.shiftKey && document.activeElement === p) { e.preventDefault(); u.focus(); }
      else if (!e.shiftKey && document.activeElement === u) { e.preventDefault(); p.focus(); }
    }
  });
  var tx = null;
  $('#visorPalco').addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  $('#visorPalco').addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 45) mostra(atual + (dx < 0 ? 1 : -1));
    tx = null;
  });

  /* ---------- GALERIA: escolher o que se vê sem abrir nada ----------
     (ideia da Boa Vida) Os separadores trocam as fotos da fila; o filete
     desliza até ao separador escolhido. A fila arrasta-se com o rato (no
     dedo é o scroll do próprio telemóvel) e, se se arrastou, o clique não
     abre o visor. Cada foto abre o visor na série do seu espaço. */
  var CATS = ['casa', 'vistas', 'pormenores', 'quartos', 'comuns'];
  var FORMA = { 'hero-vale': 4 / 3, 'tanque-original': 3 / 4 };   // as outras são quadradas
  var galFita = $('#galFita'), galAbas = $$('#galAbas button'), galLinha = $('#galLinha'), galBarra = $('#galBarra');
  var galCat = 'tudo', galTroca = null;
  function fotosGal(cat) {
    var lista = [];
    (cat === 'tudo' ? CATS : [cat]).forEach(function (c) {
      SERIES[c].fotos.forEach(function (f) { lista.push({ n: f[0], leg: f[1], serie: c }); });
    });
    return lista;
  }
  function pintaGal() {
    galFita.innerHTML = fotosGal(galCat).map(function (f, k) {
      var base = 'assets/img/' + (f.n === 'tanque-original' ? 'tanque' : f.n);
      var ar = FORMA[f.n] || 1;
      return '<li class="gal" style="--ar:' + ar.toFixed(4) + ';--i:' + k + '">' +
        '<button type="button" class="abre" data-serie="' + f.serie + '" data-foto="' + f.n + '" aria-label="Ver em grande: ' + f.leg + '">' +
        '<span class="gal__img"><img src="' + base + '-800.jpg" srcset="' + base + '-800.jpg 800w, ' + base + '-1400.jpg 1400w"' +
        ' sizes="(max-width: 700px) ' + Math.round(66 * ar) + 'vw, ' + Math.round(36 * ar) + 'vw" alt="' + f.leg + '" loading="lazy" decoding="async" draggable="false"></span>' +
        '</button><p class="gal__leg">' + f.leg + '</p></li>';
    }).join('');
    galFita.scrollLeft = 0;
    barraGal();
  }
  function linhaGal() {
    var b = galAbas.filter(function (x) { return x.getAttribute('data-cat') === galCat; })[0];
    galLinha.style.width = b.offsetWidth + 'px';
    galLinha.style.transform = 'translateX(' + b.offsetLeft + 'px)';
  }
  function barraGal() {
    var total = galFita.scrollWidth, vis = galFita.clientWidth;
    var frac = total > 0 ? Math.min(1, vis / total) : 1;
    var p = total > vis ? galFita.scrollLeft / (total - vis) : 0;
    galBarra.style.width = (frac * 100).toFixed(2) + '%';
    galBarra.style.transform = 'translateX(' + (p * (1 / frac - 1) * 100).toFixed(2) + '%)';
  }
  galAbas.forEach(function (b) {
    var c = b.getAttribute('data-cat');
    $('span', b).textContent = fotosGal(c).length;
    b.addEventListener('click', function () {
      if (c === galCat) return;
      galCat = c;
      galAbas.forEach(function (o) { o.setAttribute('aria-selected', o === b ? 'true' : 'false'); });
      linhaGal();
      // no telemóvel os separadores deslizam: o escolhido fica à vista
      var abas = b.parentNode;
      if (abas.scrollWidth > abas.clientWidth)
        abas.scrollTo({ left: b.offsetLeft - (abas.clientWidth - b.offsetWidth) / 2, behavior: reduz ? 'auto' : 'smooth' });
      // a fila esvai-se, troca e as fotos novas abrem-se uma a uma
      galFita.classList.add('is-troca');
      clearTimeout(galTroca);
      galTroca = setTimeout(function () { pintaGal(); galFita.classList.remove('is-troca'); }, reduz ? 0 : 280);
    });
  });
  pintaGal();
  linhaGal();
  window.addEventListener('resize', function () { linhaGal(); barraGal(); });
  if (document.fonts) document.fonts.addEventListener('loadingdone', linhaGal);
  galFita.addEventListener('scroll', barraGal, { passive: true });
  // arrastar com o rato
  var gArr = null, gArrastou = false;
  galFita.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    gArr = { x: e.clientX, s: galFita.scrollLeft, id: e.pointerId };
    gArrastou = false;
  });
  galFita.addEventListener('pointermove', function (e) {
    if (!gArr || e.pointerId !== gArr.id) return;
    var dx = e.clientX - gArr.x;
    if (!gArrastou && Math.abs(dx) > 6) {
      gArrastou = true;
      galFita.classList.add('is-arrasto');
      try { galFita.setPointerCapture(e.pointerId); } catch (_) {}
    }
    if (gArrastou) galFita.scrollLeft = gArr.s - dx;
  });
  var largaGal = function (e) {
    if (!gArr || (e && e.pointerId !== gArr.id)) return;
    gArr = null;
    galFita.classList.remove('is-arrasto');
  };
  galFita.addEventListener('pointerup', largaGal);
  galFita.addEventListener('pointercancel', largaGal);
  galFita.addEventListener('click', function (e) {
    if (!gArrastou) return;
    e.preventDefault(); e.stopPropagation(); gArrastou = false;
  }, true);
  galFita.addEventListener('dragstart', function (e) { e.preventDefault(); });

  /* ---------- MAPA: a lista de destinos acende o ponto no mapa ----------
     (da Quinta das Donas) Passar o rato mostra; carregar fixa (aria-pressed).
     Passar o rato por um ponto do mapa acende a linha da lista. */
  var destinos = $$('#destinos button');
  var pontos = $$('#mapa .ponto[data-poi]');
  var fixo = null;
  function acende(poi) {
    pontos.forEach(function (g) { g.classList.toggle('is-ativo', g.getAttribute('data-poi') === poi); });
    destinos.forEach(function (b) { b.classList.toggle('is-luz', b.getAttribute('data-poi') === poi); });
  }
  destinos.forEach(function (b) {
    var poi = b.getAttribute('data-poi');
    b.addEventListener('mouseenter', function () { acende(poi); });
    b.addEventListener('focus', function () { acende(poi); });
    b.addEventListener('mouseleave', function () { acende(fixo); });
    b.addEventListener('blur', function () { acende(fixo); });
    b.addEventListener('click', function () {
      fixo = fixo === poi ? null : poi;
      destinos.forEach(function (o) { o.setAttribute('aria-pressed', o.getAttribute('data-poi') === fixo ? 'true' : 'false'); });
      acende(fixo);
    });
  });
  $$('.atracao[data-poi]').forEach(function (li) {
    var poi = li.getAttribute('data-poi');
    li.addEventListener('mouseenter', function () { acende(poi); });
    li.addEventListener('mouseleave', function () { acende(fixo); });
  });
  pontos.forEach(function (g) {
    var poi = g.getAttribute('data-poi');
    if (poi === 'casa') return;
    g.addEventListener('mouseenter', function () { acende(poi); });
    g.addEventListener('mouseleave', function () { acende(fixo); });
  });

  /* ---------- COMODIDADES: a fila anda sozinha, devagar, e não acaba ----------
     (da Boa Nova) A lista é duplicada; a meio do percurso volta ao
     princípio, fora do ecrã. Rato por cima, arrastar ou o dedo param-na;
     retoma a seguir. */
  var pistaC = $('#comodPista');
  var listaC = $('.comod__lista', pistaC);
  $$('.comod__item', listaC).forEach(function (li) {
    var c = li.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    listaC.appendChild(c);
  });
  if (!reduz) {
    var VEL_C = 24;                       // px por segundo
    var cpos = 0, cantes = null, cpausa = 0, csobre = false, cvisivel = false, ccorre = false;
    var cvolta = listaC.scrollWidth / 2;
    var andaC = function (agora) {
      if (!cvisivel) { ccorre = false; return; }
      if (cantes === null) cantes = agora;
      var ms = Math.min(agora - cantes, 100);
      cantes = agora;
      if (csobre || cpausa > 0) { if (cpausa > 0) cpausa -= ms; cpos = pistaC.scrollLeft; }
      else {
        cpos += VEL_C * ms / 1000;
        if (cvolta > 0) { if (cpos >= cvolta) cpos -= cvolta; else if (cpos < 0) cpos += cvolta; }
        pistaC.scrollLeft = cpos;
      }
      requestAnimationFrame(andaC);
    };
    var ligaC = function () { if (ccorre) return; ccorre = true; cantes = null; requestAnimationFrame(andaC); };
    new IntersectionObserver(function (es) {
      cvisivel = es[0].isIntersecting;
      if (cvisivel) { cvolta = listaC.scrollWidth / 2; ligaC(); }
    }).observe(pistaC);
    window.addEventListener('resize', function () { cvolta = listaC.scrollWidth / 2; });
    var suspende = function () { cpausa = 1500; };
    pistaC.addEventListener('wheel', suspende, { passive: true });
    pistaC.addEventListener('touchstart', suspende, { passive: true });
    pistaC.addEventListener('touchmove', suspende, { passive: true });
    pistaC.addEventListener('touchend', function () { cpausa = 2500; }, { passive: true });
    pistaC.addEventListener('mouseenter', function () { csobre = true; });
    pistaC.addEventListener('mouseleave', function () { csobre = false; });
    window.addEventListener('blur', function () { csobre = false; });
    // arrastar com o rato
    var agarrado = false, cx0 = 0, cs0 = 0;
    pistaC.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      agarrado = true; cx0 = e.clientX; cs0 = pistaC.scrollLeft;
      pistaC.classList.add('is-agarrada');
      try { pistaC.setPointerCapture(e.pointerId); } catch (_) {}
    });
    pistaC.addEventListener('pointermove', function (e) {
      if (!agarrado) return;
      e.preventDefault();
      pistaC.scrollLeft = cs0 - (e.clientX - cx0);
    });
    var largaC = function (e) {
      if (!agarrado) return;
      agarrado = false;
      pistaC.classList.remove('is-agarrada');
      try { pistaC.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    pistaC.addEventListener('pointerup', largaC);
    pistaC.addEventListener('pointercancel', largaC);
  }

  $('#ano').textContent = new Date().getFullYear();
})();
