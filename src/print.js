// Fogli stampabili: tabellone (A3) e carte (3x3 per foglio A4, fronte e retro per la stampa fronte/retro).
// Riusa dati, illustrazioni e stile dell'app; i template delle carte sono la versione "da tavolo" di quelli in ui.js
// (senza chip di stato della partita).
import { BOARD, CARDS, RENT } from './data.js';
import { sticker } from './icons.js';
import { ART } from './art.js';
import wordSvg from '../brand/export/logotipo.svg?raw';

const CORNER_SUB = { start: 'Ritira 200€', jail: 'Solo di passaggio', relax: 'Pausa', gotojail: 'Senza passare dal Via' };
const KIND_ICON = { colpo: 'Shuffle', jolly: 'Shield', soldi: 'Coins', riscatto: 'Flame' };
const KIND = { colpo: 'Colpo di scena', jolly: 'Jolly', soldi: 'Soldi', riscatto: 'Riscatto' };
const art = (c, cls = 'ico') => ART[c.type] || ART[c.icon] || sticker(c.icon, cls);
const side = (i) => (i % 10 === 0 ? 'corner' : ['b', 'l', 't', 'r'][Math.floor(i / 10)]);
function gridPos(i) {
  if (i <= 10) return [11, 11 - i];
  if (i <= 20) return [21 - i, 1];
  if (i <= 30) return [1, i - 19];
  return [i - 29, 11];
}

function board() {
  const cells = BOARD.map((c, i) => {
    const [r, col] = gridPos(i);
    const g = c.type === 'prop' ? `--g: var(--${c.group});` : '';
    return `<div class="cell t-${c.type} ${side(i)}" style="grid-area:${r}/${col};${g}"><span class="num">${i + 1}</span>${art(c)}`
      + `<span class="txt"><span class="name">${c.title}</span>${c.price ? `<span class="price">${c.price}€</span>` : ''}`
      + (CORNER_SUB[c.type] ? `<span class="sub">${CORNER_SUB[c.type]}</span>` : '') + '</span></div>';
  }).join('');
  const spot = (label) => `<div class="spot"><span>Mazzo ${label}</span></div>`;
  return `<section class="page a3"><div class="pboard">${cells}<div class="pcenter"><div class="logo">${wordSvg}</div>`
    + `<div class="spots">${spot('Attività')}${spot('Proprietà')}</div></div></div></section>`;
}

const propCard = (c) => {
  const rent = c.type === 'prop' ? `Affitto ${RENT[c.group]}€ · completo ${RENT[c.group] * 2}€`
    : c.type === 'room' ? 'Affitto 25 · 50 · 100 · 200€' : '';
  return `<div class="face front cell-card t-${c.type}"${c.type === 'prop' ? ` style="--g: var(--${c.group})"` : ''}>`
    + `<header><small>${c.name}${c.price ? ` · ${c.price}€` : ''}</small><h2>${c.title}</h2></header>`
    + `<div class="art">${art(c, 'ico big')}</div><p class="task">${c.text}</p>${rent ? `<p class="rent">${rent}</p>` : ''}</div>`;
};
const actCard = (c) => `<div class="face front act-card ${c.kind}"><header><small>${KIND[c.kind]}</small><h2>${c.title}</h2></header>`
  + `<div class="art">${art({ icon: KIND_ICON[c.kind] }, 'ico big')}</div><p class="task">${c.text}</p></div>`;
const back = (label, key) => `<div class="deck-face">${ART[key]}<span>${label}</span></div>`;

// 9 carte per foglio; dopo ogni foglio di fronti, il foglio dei retro con le colonne specchiate
// (stampa fronte/retro sul lato lungo: la carta in alto a sinistra ha il retro in alto a destra).
function cards(fronts, backHTML) {
  let out = '';
  for (let k = 0; k < fronts.length; k += 9) {
    const chunk = fronts.slice(k, k + 9);
    const slots = (fill) => Array.from({ length: 9 }, (_, i) => `<div class="pcard">${fill(i)}</div>`).join('');
    out += `<section class="page a4 grid">${slots((i) => chunk[i] ?? '')}</section>`;
    out += `<section class="page a4 grid">${slots((i) => (chunk[i - (i % 3) + 2 - (i % 3)] ? backHTML : ''))}</section>`;
  }
  return out;
}

const sheet = new URLSearchParams(location.search).get('sheet') || 'tabellone';
document.body.dataset.sheet = sheet;
document.getElementById('sheets').innerHTML = {
  tabellone: board,
  attivita: () => cards(CARDS.map(actCard), back('Attività', 'deckAct')),
  proprieta: () => cards(BOARD.filter((c) => c.type !== 'card').map(propCard), back('Proprietà', 'deckProp')),
}[sheet]();
