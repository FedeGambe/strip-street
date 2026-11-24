// Fogli stampabili: tabellone (A3) e carte (3x3 per foglio A4, fronte e retro per la stampa fronte/retro).
// Riusa dati, illustrazioni e stile dell'app; i template delle carte sono in cards.js
// (qui senza chip di stato della partita).
import { BOARD, CARDS } from './data.js';
import { CORNER_SUB, art, propCard, actCard, back as backFace } from './cards.js';
import wordSvg from '../brand/export/logotipo.svg?raw';
import signSvg from '../brand/export/insegna.svg?raw';

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
  return `<section class="page a3"><div class="pboard">${cells}<div class="pcenter"><div class="sign">${signSvg}</div><div class="logo">${wordSvg}</div>`
    + `<div class="spots">${spot('Attività')}${spot('Proprietà')}</div></div></div></section>`;
}

const back = (label, key) => backFace(label, key, '');

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
  proprieta: () => cards(BOARD.filter((c) => c.type !== 'card').map((c) => propCard(c)), back('Proprietà', 'deckProp')),
}[sheet]();
