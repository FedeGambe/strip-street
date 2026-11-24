// UI: tabellone glass, mazzi al centro del tavolo, animazioni. Legge lo stato del motore
// (game.js) e lo ridisegna; le animazioni sono solo presentazione, le regole restano nel motore.
import { BOARD, CARDS, RENT, JAIL_FINE, JAIL_KISS, ORGASM_FINE } from './data.js';
import * as G from './game.js';
import * as T from './timer.js';
import { icon } from './icons.js';
import signSvg from '../brand/export/insegna.svg?raw';
import wordSvg from '../brand/export/logotipo.svg?raw';

const KEY = 'strip-street-save-v3'; // cambiare versione se cambia la forma dello stato
const $ = (id) => document.getElementById(id);
const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));

let s = JSON.parse(localStorage.getItem(KEY) || 'null');
let busy = false;       // animazione in corso: bottoni bloccati
let shownKey = null;    // carta mostrata al centro (per animare solo le nuove)
let lastMoney = null;   // per le animazioni +/-€
const tokens = [];

// Sottotitoli degli angoli, come sul tabellone del Monopoly.
const CORNER_SUB = { start: 'Ritira 200€', jail: 'Solo di passaggio', relax: 'Pausa', gotojail: 'Senza passare dal Via' };
const KIND_ICON = { colpo: 'Shuffle', jolly: 'Shield', soldi: 'Coins', riscatto: 'Flame' };
const KIND = { colpo: 'Colpo di scena', jolly: 'Jolly', soldi: 'Soldi', riscatto: 'Riscatto' };
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

// Posizione sul perimetro di una griglia 11x11 (Via in basso a destra, senso orario come Monopoli).
function gridPos(i) {
  if (i <= 10) return [11, 11 - i];
  if (i <= 20) return [21 - i, 1];
  if (i <= 30) return [1, i - 19];
  return [i - 29, 11];
}
// Lato del tabellone: serve a mettere la fascia colorata sul bordo interno.
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
    el.title = `${c.title}: ${c.text}`;
    el.innerHTML = `<span class="num">${i + 1}</span>${icon(c.icon)}`
      + `<span class="txt"><span class="name">${c.title}</span>`
      + (c.price ? `<span class="price">${c.price}€</span>` : '')
      + (CORNER_SUB[c.type] ? `<span class="sub">${CORNER_SUB[c.type]}</span>` : '') + '</span>';
    board.append(el);
  });
  for (let n = 0; n < 2; n++) {
    const t = document.createElement('div');
    t.className = `token p${n}`;
    t.innerHTML = '<i></i>';
    board.append(t);
    tokens.push(t);
  }
  $('deck-act').innerHTML = `<div class="deck-face">${icon('Sparkles')}<span>Attività</span></div>`;
  $('deck-prop').innerHTML = `<div class="deck-face">${icon('KeyRound')}<span>Proprietà</span></div>`;
  addEventListener('resize', () => s && s.players.forEach((p, n) => placeToken(n, p.pos)));
}

function placeToken(n, pos, hop = false) {
  const cell = $(`c${pos}`);
  const t = tokens[n];
  // in alto a destra nella casella, una accanto all'altra
  const x = cell.offsetLeft + cell.offsetWidth - t.offsetWidth * (n ? 1.15 : 2.3) - 6;
  const y = cell.offsetTop + cell.offsetHeight * 0.2;
  t.style.transform = `translate(${x}px, ${y}px)`;
  if (hop && !reduced) t.firstChild.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-12px)' }, { transform: 'translateY(0)' }], { duration: 160, easing: 'ease-out' });
}

// --- Dadi ---

const dieHTML = (n) => Array.from({ length: 9 }, (_, i) => `<i class="${PIPS[n].includes(i) ? 'on' : ''}"></i>`).join('');
const d6 = () => 1 + Math.floor(Math.random() * 6);
function showDice(d) {
  [...$('dice').children].forEach((el, i) => { el.innerHTML = dieHTML(d[i]); });
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
  for (let k = 0; k < 9; k++) { showDice([d6(), d6()]); await wait(70); }
  dice.classList.remove('rolling');
  showDice(s.dice);
  await wait(250);
  const steps = s.dice[0] + s.dice[1];
  for (let k = 1; k <= steps; k++) { placeToken(who, (from + k) % BOARD.length, true); await wait(170); }
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
  const rent = c.type === 'prop' ? `Affitto ${RENT[c.group]}€ · completo ${RENT[c.group] * 2}€`
    : c.type === 'room' ? 'Affitto 25 · 50 · 100 · 200€' : '';
  return `<div class="face front cell-card t-${c.type}"${c.type === 'prop' ? ` style="--g: var(--${c.group})"` : ''}>`
    + `<header><small>${c.name}${c.price ? ` · ${c.price}€` : ''}</small><h2>${c.title}</h2></header>`
    + `<div class="art">${icon(c.icon, 'ico big')}</div><p class="task">${c.text}</p>${rent ? `<p class="rent">${rent}</p>` : ''}`
    + `<footer>${chips.join('')}</footer></div>`;
}

function actCard(id) {
  const c = CARDS[id];
  return `<div class="face front act-card ${c.kind}">`
    + `<header><small>${KIND[c.kind]}</small><h2>${c.title}</h2></header>`
    + `<div class="art">${icon(KIND_ICON[c.kind], 'ico big')}</div><p class="task">${c.text}</p>`
}

const back = (label, ico) => `<div class="face back"><div class="deck-face">${icon(ico)}<span>${label}</span></div></div>`;

function renderSlot() {
  const L = s.landing;
  const slot = $('slot');
  const p = s.players[s.turn];
  if (!L) {
    shownKey = null;
    slot.innerHTML = s.phase === 'over' ? ''
      : `<div class="hint">${icon('Sparkles', 'ico big')}<br>Tocca a <b class="p${s.turn}">${esc(p.name)}</b>${p.inJail ? '<br><small>Sei in prigione: esci subito o salta il turno</small>' : ''}</div>`;
    return;
  }
  const key = `${s.turn}|${s.dice}|${L.pos}|${L.card}`;
  const fresh = key !== shownKey;
  shownKey = key;
  const cards = [];
  if (L.card != null) cards.push({ html: actCard(L.card) + back('Attività', 'Sparkles'), from: 'act' });
  if (BOARD[L.pos].type !== 'card') cards.push({ html: cellCard(L.pos, L) + back('Proprietà', 'KeyRound'), from: 'prop' });
  slot.innerHTML = cards.map((c, i) => `<div class="card ${fresh ? `draw from-${c.from}` : ''}" style="animation-delay:${i * 0.35}s">${c.html}</div>`).join('');
  if (fresh && !reduced) cards.forEach((c) => $(`deck-${c.from}`).animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-8px)' }, { transform: 'translateY(0)' }], { duration: 300 }));
}

// --- Render generale ---

function render() {
  localStorage.setItem(KEY, JSON.stringify(s));
  $('setup').hidden = !!s;
  $('board').hidden = !s;
  if (!s) return;
  const p = s.players[s.turn];
  const L = s.landing;

  BOARD.forEach((_, i) => {
    const el = $(`c${i}`);
    el.dataset.owner = s.owners[i] ?? '';
    el.classList.toggle('here', !busy && L?.pos === i);
  });
  if (!busy) s.players.forEach((pl, n) => placeToken(n, pl.pos));
  if (s.dice && !busy) showDice(s.dice);

  $('players').innerHTML = s.players.map((pl, n) => {
    const hand = [['jailFree', 'Esci di prigione', 'KeyRound'], ['shield', 'Scudo', 'Shield']]
      .flatMap(([k, label, ico]) => Array(G.held(pl, k)).fill(`<span class="chip">${icon(ico)}${label}</span>`)).join('');
    return `<div class="player glass p${n} ${n === s.turn && s.phase !== 'over' ? 'active' : ''} ${s.winner === n ? 'winner' : ''}">`
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
  if (!busy) lastMoney = s.players.map((pl) => pl.money);

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

  $('quick').replaceChildren(...[30, 60, 120].map((n) => btn(T.fmt(n), () => T.start(n), { cls: 'small' })));

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
  shownKey = lastMoney = null;
  render();
};

$('reset').onclick = () => {
  if (busy) return;
  s = null;
  shownKey = lastMoney = null;
  T.stop();
  render();
};

// Marchio: SVG generati da brand/build.py, inseriti inline così le animazioni CSS li raggiungono.
$('brand-sign').insertAdjacentHTML('beforeend', signSvg);
$('brand-word').insertAdjacentHTML('beforeend', wordSvg);

buildBoard();
render();
