// UI: tabellone stile gioco da tavolo, mazzi al centro del tavolo, animazioni. Legge lo stato del motore
// (game.js) e lo ridisegna; le animazioni sono solo presentazione, le regole restano nel motore.
import { BOARD, CARDS, RENT, JAIL_FINE, JAIL_KISS, ORGASM_FINE } from './data.js';
import * as G from './game.js';
import * as T from './timer.js';
import * as S from './sound.js';
import { icon } from './icons.js';
import { ART } from './art.js';
import { CORNER_SUB, art, propCard, actCard as actFace, back } from './cards.js';
import { PAGES, renderPage } from './pages.js';
import signSvg from '../brand/export/insegna.svg?raw';
import wordSvg from '../brand/export/logotipo.svg?raw';
import markUrl from '../brand/export/simbolo.svg?url';
import logoUrl from '../brand/export/semplificato.svg?url';

const KEY = 'strip-street-save-v3'; // cambiare versione se cambia la forma dello stato
const $ = (id) => document.getElementById(id);
const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));

let s = JSON.parse(localStorage.getItem(KEY) || 'null');
let busy = false;       // animazione in corso: bottoni bloccati
let shownKey = null;    // carta mostrata al centro (per animare solo le nuove)
let lastMoney = null;   // per le animazioni +/-€
let lastJail = null;    // per il suono quando qualcuno finisce in prigione
let lastPhase = null;   // per il suono di vittoria
const tokens = [];

const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

// Posizione sul perimetro di una griglia 11x11 (Via in basso a destra, senso orario come Monopoli).
function gridPos(i) {
  if (i <= 10) return [11, 11 - i];
  if (i <= 20) return [21 - i, 1];
  if (i <= 30) return [1, i - 19];
  return [i - 29, 11];
}
// Lato del tabellone: serve a mettere la fascia colorata sul bordo interno.
const PAWN = '<svg viewBox="0 0 24 30" aria-hidden="true"><g stroke="#1A0F17" stroke-width="2" stroke-linejoin="round"><path d="M8 13h8l2.5 11h-13z"/><circle cx="12" cy="8" r="5"/><rect x="3" y="24" width="18" height="5" rx="2"/></g></svg>';
const side = (i) => (i % 10 === 0 ? 'corner' : ['b', 'l', 't', 'r'][Math.floor(i / 10)]);

function btn(label, fn, { disabled = false, cls = '' } = {}) {
  const b = document.createElement('button');
  b.textContent = label;
  b.className = cls;
  b.disabled = disabled || busy;
  b.onclick = () => { if (busy) return; fn(); render(); };
  return b;
}

// --- Tabellone (costruito una volta, poi aggiornato) ---

function buildBoard() {
  const board = $('board');
  BOARD.forEach((c, i) => {
    const el = document.createElement('div');
    const [r, col] = gridPos(i);
    el.id = `c${i}`;
    el.className = `cell t-${c.type} ${side(i)}`;
    el.style.gridArea = `${r} / ${col}`;
    if (c.type === 'prop') el.style.setProperty('--g', `var(--${c.group})`);
    el.tabIndex = 0; // il box si apre anche da tastiera
    el.setAttribute('aria-describedby', 'tip');
    el.innerHTML = `<span class="num">${i + 1}</span>${art(c)}`
      + `<span class="txt"><span class="name">${c.title}</span>`
      + (c.price ? `<span class="price">${c.price}€</span>` : '')
      + (CORNER_SUB[c.type] ? `<span class="sub">${CORNER_SUB[c.type]}</span>` : '') + '</span>';
    board.append(el);
  });
  for (let n = 0; n < 2; n++) {
    const t = document.createElement('div');
    t.className = `token p${n}`;
    t.innerHTML = PAWN;
    board.append(t);
    tokens.push(t);
  }
  $('deck-act').innerHTML = back('Attività', 'deckAct', '');
  $('deck-prop').innerHTML = back('Proprietà', 'deckProp', '');
  addEventListener('resize', () => s && s.players.forEach((p, n) => placeToken(n, p.pos)));
  const tip = document.createElement('div');
  tip.id = 'tip';
  tip.setAttribute('role', 'tooltip');
  document.body.append(tip);
  const open = (e) => { const cell = e.target.closest?.(".cell"); if (cell && (tip.dataset.at !== cell.id || !tip.classList.contains("on"))) showTip(cell); };
  // Col dito pointerover/pointerout arrivano tutti insieme al rilascio: il tocco ha la sua gestione più sotto.
  const touch = (e) => e.pointerType === 'touch';
  board.addEventListener('pointerover', (e) => { if (!touch(e)) open(e); });
  // da tastiera si apre col focus; col mouse il clic lascia il focus sulla casella, quindi qui solo :focus-visible
  board.addEventListener('focusin', (e) => { if (e.target.matches?.('.cell:focus-visible')) open(e); });
  // si chiude appena il puntatore esce dalla casella (anche verso il centro del tabellone)
  board.addEventListener('pointerout', (e) => {
    if (touch(e)) return;
    const cell = e.target.closest?.('.cell');
    if (cell && !cell.contains(e.relatedTarget) && tip.dataset.at === cell.id) hideTip();
  });
  board.addEventListener('pointerleave', (e) => { if (!touch(e)) hideTip(); });
  // Al tocco: un tap sulla casella apre il box (un secondo tap lo chiude), un tap altrove lo chiude.
  board.addEventListener('pointerup', (e) => {
    const cell = touch(e) && e.target.closest?.('.cell');
    if (!cell) return;
    if (tip.classList.contains('on') && tip.dataset.at === cell.id) hideTip();
    else showTip(cell);
  });
  document.addEventListener('pointerdown', (e) => { if (touch(e) && !e.target.closest?.('.cell')) hideTip(); });
  board.addEventListener('focusout', hideTip);
  addEventListener('scroll', hideTip, true);
}

// --- Box informativo della casella (hover / focus) ---

function showTip(cell) {
  const tip = $('tip');
  const i = +cell.id.slice(1);
  const c = BOARD[i];
  const owner = s?.owners[i];
  const here = s ? s.players.filter((p) => p.pos === i).map((p) => esc(p.name)) : [];
  const rent = c.type === 'prop' ? `Affitto <b>${RENT[c.group]}€</b> · colore completo <b>${RENT[c.group] * 2}€</b>`
    : c.type === 'room' ? 'Affitto <b>25 · 50 · 100 · 200€</b> per 1–4 stanze' : '';
  const status = owner != null ? `<span class="chip p${owner}">Di ${esc(s.players[owner].name)}</span>`
    : c.price ? '<span class="chip">Libera</span>' : '';
  tip.className = `t-${c.type}`;
  tip.dataset.at = cell.id;
  tip.style.setProperty('--g', c.type === 'prop' ? `var(--${c.group})` : '');
  tip.innerHTML = `<header><small>${c.name} · casella ${i + 1}</small><b>${c.title}</b>`
    + (c.price ? `<span class="price">${c.price}€</span>` : '') + '</header>'
    + `<p>${c.text}</p>`
    + (rent ? `<p class="rent">${rent}</p>` : '')
    + (c.timer ? `<p class="rent">Sfida a tempo: <b>${c.timer}s</b></p>` : '')
    + (status || here.length ? `<footer>${status}${here.length ? `<span class="chip">Qui: ${here.join(', ')}</span>` : ''}</footer>` : '');
  // Si apre verso il centro del tavolo (non copre le caselle vicine); sempre dentro lo schermo.
  const r = cell.getBoundingClientRect();
  tip.classList.add('on');
  const w = tip.offsetWidth, h = tip.offsetHeight, m = 8;
  const sd = side(i), cx = r.left + r.width / 2 - w / 2, cy = r.top + r.height / 2 - h / 2;
  let x = cx, y = cy;
  if (sd === 'l') x = r.right + m;
  else if (sd === 'r') x = r.left - w - m;
  else if (sd === 't') y = r.bottom + m;
  else if (sd === 'b') y = r.top - h - m;
  else { x = i === 0 || i === 30 ? r.left - w - m : r.right + m; y = i < 20 ? r.top - h - m : r.bottom + m; } // angoli
  x = Math.min(Math.max(x, m), innerWidth - w - m);
  y = Math.min(Math.max(y, m), innerHeight - h - m);
  tip.style.transform = `translate(${x}px, ${y}px)`;
}

const hideTip = () => $('tip')?.classList.remove('on');

// Posizione mostrata di ciascuna pedina (durante i passi differisce da s.players[n].pos).
const shown = [];

function placeToken(n, pos, hop = false) {
  const prev = shown[n];
  shown[n] = pos;
  layoutToken(n);
  // l'altra pedina si sposta di lato se la raggiungo, torna al centro se me ne vado
  const o = 1 - n;
  if (shown[o] != null && (shown[o] === pos || shown[o] === prev)) layoutToken(o);
  if (hop && !reduced) tokens[n].firstChild.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-12px)' }, { transform: 'translateY(0)' }], { duration: 160, easing: 'ease-out' });
}

// Sul bordo interno della casella (fascia colore, verso il centro del tavolo): non copre nome e disegno.
// Se le due pedine stanno sulla stessa casella si affiancano lungo il bordo, altrimenti stanno al centro.
function layoutToken(n) {
  const pos = shown[n];
  const cell = $(`c${pos}`);
  const t = tokens[n];
  const w = t.offsetWidth, h = t.offsetHeight;
  const { offsetLeft: L, offsetTop: T, offsetWidth: W, offsetHeight: H } = cell;
  const shared = shown[1 - n] === pos;
  const off = shared ? (n ? 0.62 : -0.62) : 0;
  const out = 0.3; // quota della pedina che sporge sul tavolo
  const sd = side(pos);
  let x, y;
  if (sd === 'b') { x = L + W / 2 - w / 2 + off * w; y = T - h * out; }
  else if (sd === 't') { x = L + W / 2 - w / 2 + off * w; y = T + H - h * (1 - out); }
  else if (sd === 'l') { x = L + W - w * (1 - out); y = T + H / 2 - h / 2 + off * h; }
  else if (sd === 'r') { x = L - w * out; y = T + H / 2 - h / 2 + off * h; }
  else { // angoli: dentro la casella, vicino allo spigolo verso il tavolo; la seconda pedina accanto
    const leftEdge = pos === 0 || pos === 30; // Via e Vai in prigione hanno il tavolo a sinistra
    const topEdge = pos === 0 || pos === 10;  // Via e Prigione hanno il tavolo sopra
    const m = w * 0.35;
    x = (leftEdge ? L + m : L + W - w - m) + (shared && n ? (leftEdge ? 1.15 : -1.15) * w : 0);
    y = topEdge ? T + m : T + H - h - m;
  }
  t.style.transform = `translate(${x}px, ${y}px)`;
}

// Durante la transizione dello zoom le caselle si spostano: le pedine le inseguono per ~0,6s.
function followTokens() {
  const end = performance.now() + 600;
  const step = () => {
    if (!busy) s.players.forEach((p, n) => placeToken(n, p.pos));
    if (performance.now() < end) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// --- Dadi ---

const dieHTML = (n) => Array.from({ length: 9 }, (_, i) => `<i class="${PIPS[n].includes(i) ? 'on' : ''}"></i>`).join('');
// Dadi 3D: cubo CSS a 6 facce. ROT = rotazione [X, Y] che porta la faccia n davanti;
// turns accumula i giri extra, così ogni lancio rotola in avanti e mai all'indietro.
const ROT = { 1: [0, 0], 2: [0, -90], 3: [-90, 0], 4: [90, 0], 5: [0, 90], 6: [0, 180] };
const turns = [[0, 0], [0, 0]];
function showDice(d, spin = false) {
  [...$('dice').children].forEach((el, i) => {
    if (!el.firstChild) {
      el.innerHTML = `<div class="cube">${[1, 2, 3, 4, 5, 6].map((n) => `<div class="f f${n}">${dieHTML(n)}</div>`).join('')}</div>`;
      // cubo appena creato: fissa la posizione di partenza prima del lancio, altrimenti la transizione non parte
      el.firstChild.style.transform = 'rotateX(0deg) rotateY(0deg)';
      el.firstChild.getBoundingClientRect();
    }
    if (spin) {
      turns[i][0] += 360 * (1 + Math.floor(Math.random() * 2));
      turns[i][1] += 360 * (1 + Math.floor(Math.random() * 2)) * (i ? -1 : 1); // i due dadi girano in versi opposti
    }
    const [x, y] = ROT[d[i]];
    el.firstChild.style.transform = `rotateX(${x + turns[i][0]}deg) rotateY(${y + turns[i][1]}deg)`;
  });
}

async function rollDice() {
  if (busy) return;
  busy = true;
  render();
  const who = s.turn;
  const from = s.players[who].pos;
  G.roll(s);
  const dice = $('dice');
  dice.classList.add('rolling');
  showDice(s.dice, true);
  S.dice();
  await wait(1300); // durata della transizione del cubo (style.css)
  dice.classList.remove('rolling');
  await wait(150);
  const steps = s.dice[0] + s.dice[1];
  for (let k = 1; k <= steps; k++) { placeToken(who, (from + k) % BOARD.length, true); S.step(); await wait(170); }
  await wait(250);
  busy = false;
  render(); // eventuali salti (prigione, carte) scivolano con la transizione CSS
}

// --- Carte al centro ---

function cellCard(pos, L) {
  const c = BOARD[pos];
  const owner = s.owners[pos];
  const name = (n) => `<b class="p${n}">${esc(s.players[n].name)}</b>`;
  const chips = [];
  if (owner != null) chips.push(`<span class="chip">Di ${name(owner)}</span>`);
  if (L.canBuy && c.type === 'prop') chips.push(`<span class="chip">Se compri esegue ${name(1 - s.turn)}</span>`);
  if (L.canBuy && c.type === 'room') chips.push('<span class="chip">Libera</span>');
  if (L.own) chips.push('<span class="chip">È tua · al sicuro</span>');
  if (L.rent) chips.push(`<span class="chip">Affitto pagato ${L.rent.amount}€</span>`);
  if (L.doer != null) chips.push(`<span class="chip strong">Esegue ${name(L.doer)}</span>`);
  if (L.double) chips.push('<span class="chip strong">Durata ×2</span>');
  return propCard(c, chips.join(''));
}

const actCard = (id) => actFace(CARDS[id]);

function renderSlot() {
  const L = s.landing;
  const slot = $('slot');
  const p = s.players[s.turn];
  if (!L) {
    shownKey = null;
    slot.innerHTML = s.phase === 'over' ? ''
      : `<div class="hint">${ART.Sparkles}<br>Tocca a <b class="p${s.turn}">${esc(p.name)}</b>${p.inJail ? '<br><small>Sei in prigione: esci subito o salta il turno</small>' : ''}</div>`;
    return;
  }
  const key = `${s.turn}|${s.dice}|${L.pos}|${L.card}`;
  const fresh = key !== shownKey;
  shownKey = key;
  const cards = [];
  if (L.card != null) cards.push({ html: actCard(L.card) + back('Attività', 'deckAct'), from: 'act' });
  if (BOARD[L.pos].type !== 'card') cards.push({ html: cellCard(L.pos, L) + back('Proprietà', 'deckProp'), from: 'prop' });
  slot.innerHTML = cards.map((c, i) => `<div class="card ${fresh ? `draw from-${c.from}` : ''}" style="animation-delay:${i * 0.35}s">${c.html}</div>`).join('');
  if (fresh) S.card();
  if (fresh && !reduced) cards.forEach((c) => $(`deck-${c.from}`).animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-8px)' }, { transform: 'translateY(0)' }], { duration: 300 }));
}

// --- Render generale ---

function render() {
  localStorage.setItem(KEY, JSON.stringify(s));
  const page = location.hash.slice(1);
  const onPage = Object.hasOwn(PAGES, page);
  $('setup').hidden = !!s || onPage;
  $('board').hidden = !s || onPage;
  // barra fissa in vista nel setup e nelle sottopagine; in partita si apre con la linguetta
  document.body.classList.toggle('pinned', !s || onPage);
  document.querySelectorAll('.game-only').forEach((el) => { el.hidden = !s; });
  if (!s || onPage) return;
  const p = s.players[s.turn];
  const L = s.landing;

  BOARD.forEach((_, i) => {
    const el = $(`c${i}`);
    el.dataset.owner = s.owners[i] ?? '';
    el.classList.toggle('here', !busy && L?.pos === i);
  });
  if (!busy) {
    const zoom = $('zoom').value;
    if ($('board').dataset.zoom !== zoom) { $('board').dataset.zoom = zoom; followTokens(); }
    const focus = zoom !== 'off' ?['b', 'l', 't', 'r'][Math.floor((L?.pos ?? p.pos) / 10) % 4] : '';
    if ($('board').dataset.focus !== focus) { $('board').dataset.focus = focus; followTokens(); }
    s.players.forEach((pl, n) => placeToken(n, pl.pos));
  }
  if (s.dice && !busy) showDice(s.dice);

  $('players').innerHTML = s.players.map((pl, n) => {
    const hand = [['jailFree', 'Esci di prigione', 'KeyRound'], ['shield', 'Scudo', 'Shield']]
      .flatMap(([k, label, ico]) => Array(G.held(pl, k)).fill(`<span class="chip">${icon(ico)}${label}</span>`)).join('');
    return `<div class="player box p${n} ${s.phase === 'over' ? '' : n === s.turn ? 'active' : 'idle'} ${s.winner === n ? 'winner' : ''}">`
      + `<div class="who"><span class="dot"></span><b>${esc(pl.name)}</b>${pl.inJail ? '<span class="chip">in prigione</span>' : ''}</div>`
      + `<div class="money">${pl.money}<small>€</small></div>`
      + `<div class="meta"><span>${icon('Shirt')}${pl.clothes} indumenti</span><span>${icon('KeyRound')}${G.propsOf(s, n).length} proprietà</span></div>`
      + (hand ? `<div class="hand">${hand}</div>` : '') + '</div>';
  }).join('');
  if (lastMoney && !busy) s.players.forEach((pl, n) => {
    const d = pl.money - lastMoney[n];
    if (!d) return;
    const span = document.createElement('span');
    span.className = `delta ${d > 0 ? 'up' : 'down'}`;
    span.textContent = `${d > 0 ? '+' : '−'}${Math.abs(d)}€`;
    $('players').children[n].append(span);
  });
  if (lastMoney && !busy) {
    const d = s.players.map((pl, n) => pl.money - lastMoney[n]);
    // un suono solo: se qualcuno incassa vince il ding (affitti: uno paga, l'altro riceve)
    if (d.some((x) => x > 0)) S.coin(); else if (d.some((x) => x < 0)) S.pay();
  }
  if (!busy) lastMoney = s.players.map((pl) => pl.money);
  if (!busy) {
    if (lastJail && s.players.some((pl, n) => pl.inJail && !lastJail[n])) S.jail();
    if (lastPhase && lastPhase !== 'over' && s.phase === 'over') S.win();
    lastJail = s.players.map((pl) => pl.inJail);
    lastPhase = s.phase;
  }

  $('alert').hidden = busy || !s.alert;
  $('alert').textContent = s.alert || '';
  if (!busy) renderSlot();

  const a = [];
  if (s.phase === 'roll' && p.inJail) {
    a.push(btn(`Paga ${JAIL_FINE}€`, () => G.payJail(s)));
    a.push(btn(`Bacio di ${JAIL_KISS}s`, () => { G.kissJail(s); T.start(JAIL_KISS); }));
    if (G.held(p, 'jailFree')) a.push(btn('Usa Esci di prigione', () => G.useJailFree(s)));
    a.push(btn('Salto il turno', () => G.skipJail(s)));
  } else if (s.phase === 'roll') {
    const b = btn('Lancia i dadi', () => {}, { cls: 'primary' });
    b.onclick = rollDice;
    a.push(b);
  } else if (s.phase === 'action' && !busy) {
    const cell = BOARD[L.pos];
    const card = L.card != null ? CARDS[L.card] : null;
    if (L.canBuy) a.push(btn(`Compra · ${cell.price}€`, () => G.buy(s), { disabled: p.money < cell.price }));
    L.choice?.forEach((o, i) => a.push(btn(o.label, () => G.choose(s, i))));
    if (L.swap) a.push(swapForm());
    const sec = (card?.timer || ((L.doer != null || cell.type === 'relax') && cell.timer)) * (L.double ? 2 : 1);
    if (sec) a.push(btn(`⏱ Avvia ${T.fmt(sec)}`, () => T.start(sec)));
    a.push(btn(s.again ? 'Fatto · tira ancora' : 'Fatto · fine turno', () => { G.endTurn(s); T.stop(); }, { disabled: !!L.choice, cls: 'primary' }));
  }
  $('actions').replaceChildren(...a);

  $('quick').replaceChildren(...[30, 60, 120].map((n) => btn(T.fmt(n), () => { T.start(n); $('settings').close(); }, { cls: 'small' })));

  $('manual').replaceChildren(...(s.phase === 'over' ? [] : s.players.flatMap((pl, n) => [
    Object.assign(document.createElement('h3'), { textContent: pl.name, className: `p${n}` }),
    btn('−1 indumento', () => G.setClothes(s, n, -1), { disabled: !pl.clothes, cls: 'small' }),
    btn('+1 indumento', () => G.setClothes(s, n, 1), { cls: 'small' }),
    btn(`Orgasmo · paga ${ORGASM_FINE}€`, () => G.orgasm(s, n), { cls: 'small' }),
    btn(`Multa prigione · ${JAIL_FINE}€`, () => G.jailFine(s, n), { disabled: !pl.inJail, cls: 'small' }),
    btn('Usa lo Scudo', () => G.useShield(s, n), { disabled: !G.held(pl, 'shield'), cls: 'small' }),
  ]).concat(btn('Avete ceduto (fuori dalla casella 40)', () => G.cede(s), { cls: 'small danger' }))));

  $('log').innerHTML = s.log.slice(0, 40).map((m) => `<li>${esc(m)}</li>`).join('');
}

// Carta "Scambio Strategico": scegli la tua proprietà e quella del partner (valore uguale o superiore).
function swapForm() {
  const opts = (who) => G.propsOf(s, who).map((i) => `<option value="${i}">${BOARD[i].title} (${BOARD[i].price}€)</option>`).join('');
  const f = document.createElement('form');
  f.className = 'swap';
  f.innerHTML = `<select name="mine" aria-label="Tua proprietà">${opts(s.turn)}</select><span>⇄</span>`
    + `<select name="theirs" aria-label="Proprietà del partner">${opts(1 - s.turn)}</select><button>Scambia</button>`;
  f.onsubmit = (e) => {
    e.preventDefault();
    G.swap(s, +f.mine.value, +f.theirs.value);
    render();
  };
  return f;
}

$('setup').onsubmit = (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  s = G.newGame([1, 2].map((n) => ({ name: f.get(`p${n}`), clothes: +f.get(`c${n}`) })));
  shownKey = lastMoney = lastJail = lastPhase = null;
  render();
};

$('open-settings').onclick = () => $('settings').showModal();
// Barra in alto: si apre/chiude solo con la linguetta; un clic fuori la richiude.
function toggleBar(open = !$('bar').classList.contains('open')) {
  $('bar').classList.toggle('open', open);
  $('bar-tab').textContent = open ? 'Nascondi ▴' : 'Mostra ▾';
  $('bar-tab').setAttribute('aria-expanded', open);
}
$('bar-tab').onclick = () => toggleBar();
document.addEventListener('click', (e) => {
  if ($('bar').classList.contains('open') && !$('bar').contains(e.target) && !$('settings').open) toggleBar(false);
});
// Preferenze generali: salvate a parte dalla partita, restano anche con "Nuova partita".
const ZOOM_KEY = 'strip-street-zoom';
const savedZoom = localStorage.getItem(ZOOM_KEY);
$('zoom').value = ['off', 'leggero', 'medio', 'forte'].includes(savedZoom) ? savedZoom : 'forte'; // default: forte ('on' della versione vecchia compreso)
$('zoom').onchange = () => { localStorage.setItem(ZOOM_KEY, $('zoom').value); render(); };
$('sound').value = S.getLevel();
$('sound').onchange = () => { S.setLevel($('sound').value); S.coin(); }; // anteprima del volume

$('reset').onclick = () => {
  if (busy || !confirm('Iniziare una nuova partita? Quella in corso andrà persa.')) return;
  s = null;
  shownKey = lastMoney = lastJail = lastPhase = null;
  T.stop();
  toggleBar(false);
  render();
};

// Marchio: SVG generati da brand/build.py, inseriti inline così le animazioni CSS li raggiungono.
$('brand-sign').insertAdjacentHTML('beforeend', signSvg);
$('setup-deco').innerHTML = ['Cherry', 'Heart', 'Crown', 'Flame', 'Ribbon'].map((k) => ART[k]).join('');
document.querySelectorAll('.field').forEach((f) => f.insertAdjacentHTML('afterbegin', `<span class="pawn">${PAWN}</span>`));
$('brand-word').insertAdjacentHTML('beforeend', wordSvg);
// Sfondo del setup: simboli e stelle sparsi a caso, logo fisso in basso a destra.
const STAR = '<svg viewBox="-10 -10 20 20"><path d="M0-10Q1-1 10 0Q1 1 0 10Q-1 1-10 0Q-1-1 0-10Z"/></svg>';
$('setup-bg').innerHTML = Array.from({ length: 34 }, (_, i) => {
  const mark = i % 4 === 0;
  const size = mark ? 40 + Math.random() * 50 : 8 + Math.random() * 22;
  const css = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${size}px;--r:${Math.random() * 60 - 30}deg;--d:${(Math.random() * 4).toFixed(1)}s`;
  return mark ? `<img class="bg-mark" src="${markUrl}" alt="" style="${css}">` : `<i class="bg-star" style="${css}">${STAR}</i>`;
}).join('') + `<img class="bg-logo" src="${logoUrl}" alt="">`;

// Sottopagine dall'header: #caselle, #carte, #guida (# = gioco). La partita resta in memoria e si riprende.
function route() {
  const page = location.hash.slice(1);
  const onPage = Object.hasOwn(PAGES, page);
  $('page').hidden = !onPage;
  if (onPage) $('page').innerHTML = renderPage(page);
  document.querySelectorAll('.nav a').forEach((a) => {
    if (a.getAttribute('href').slice(1) === (onPage ? page : '')) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  hideTip();
  toggleBar(false);
  render();
  if (onPage) { $('page').scrollTop = 0; $('page').focus({ preventScroll: true }); }
}
addEventListener('hashchange', route);

buildBoard();
route();
