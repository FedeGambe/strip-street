// Template delle carte condivisi da partita (ui.js), sottopagine (pages.js) e fogli da stampare (print.js).
import { RENT } from './data.js';
import { sticker } from './icons.js';
import { ART } from './art.js';

// Sottotitoli degli angoli, come sul tabellone del Monopoly.
export const CORNER_SUB = { start: 'Ritira 200€', jail: 'Solo di passaggio', relax: 'Pausa', gotojail: 'Senza passare dal Via' };
export const KIND_ICON = { colpo: 'Shuffle', jolly: 'Shield', soldi: 'Coins', riscatto: 'Flame' };
export const KIND = { colpo: 'Colpo di scena', jolly: 'Jolly', soldi: 'Soldi', riscatto: 'Riscatto' };

// Illustrazione dedicata (angoli per tipo, le altre per icona); se manca, icona ad adesivo.
export const art = (c, cls = 'ico') => ART[c.type] || ART[c.icon] || sticker(c.icon, cls);

export const rentLine = (c) => (c.type === 'prop' ? `Affitto ${RENT[c.group]}€ · completo ${RENT[c.group] * 2}€`
  : c.type === 'room' ? 'Affitto 25 · 50 · 100 · 200€' : '');

// Fronte della carta di una casella; footer: chip di stato (solo in partita).
export function propCard(c, footer = null) {
  const rent = rentLine(c);
  return `<div class="face front cell-card t-${c.type}"${c.type === 'prop' ? ` style="--g: var(--${c.group})"` : ''}>`
    + `<header><small>${c.name}${c.price ? ` · ${c.price}€` : ''}</small><h2>${c.title}</h2></header>`
    + `<div class="art">${art(c, 'ico big')}</div><p class="task">${c.text}</p>${rent ? `<p class="rent">${rent}</p>` : ''}`
    + (footer != null ? `<footer>${footer}</footer>` : '') + '</div>';
}

export const actCard = (c) => `<div class="face front act-card ${c.kind}"><header><small>${KIND[c.kind]}</small><h2>${c.title}</h2></header>`
  + `<div class="art">${art({ icon: KIND_ICON[c.kind] }, 'ico big')}</div><p class="task">${c.text}</p></div>`;

export const back = (label, key, cls = 'face back') => `<div class="${cls} deck-face">${ART[key]}<span>${label}</span></div>`;
