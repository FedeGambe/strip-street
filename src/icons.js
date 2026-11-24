// Icone Lucide usate nel gioco. Importate una per una così il bundle resta piccolo:
// per aggiungerne una, importarla qui e usarne il nome in data.js.
import {
  createElement, ArrowLeft, Eye, Sparkles, MessageCircleHeart, Heart, Sofa, Speech,
  WandSparkles, Lock, Hand, Zap, EyeOff, Target, ChefHat, Hourglass, Ban, Shirt, Martini, Glasses, Feather,
  Ear, ShowerHead, Link, Crown, Music, Ribbon, Siren, Droplet, Vibrate, Moon, BedDouble, Cherry, Infinity,
  Flame, Shuffle, Shield, Coins, KeyRound, Timer, MessageCircleQuestion,
} from 'lucide';

const ICONS = {
  ArrowLeft, Eye, Sparkles, MessageCircleHeart, Heart, Sofa, Speech, WandSparkles, Lock,
  Hand, Zap, EyeOff, Target, ChefHat, Hourglass, Ban, Shirt, Martini, Glasses, Feather, Ear, ShowerHead, Link,
  Crown, Music, Ribbon, Siren, Droplet, Vibrate, Moon, BedDouble, Cherry, Infinity, Flame, Shuffle, Shield,
  Coins, KeyRound, Timer, MessageCircleQuestion,
};

// Restituisce l'SVG come stringa, da inserire in un template HTML.
export const icon = (name, cls = 'ico') =>
  createElement(ICONS[name] || Sparkles, { class: cls, 'aria-hidden': 'true', 'stroke-width': 2 }).outerHTML;

// Versione illustrata, effetto adesivo: la stessa icona ripassata due volte, sotto una sagoma
// piena nel colore --tint spostata di lato, sopra il tratto d'inchiostro.
export function sticker(name, cls = 'ico') {
  const inner = createElement(ICONS[name] || Sparkles).innerHTML;
  return `<svg class="${cls} sticker" viewBox="-2 -2 28 28" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">`
    + `<g class="fill" transform="translate(1.4 1.4)" stroke-width="4.5">${inner}</g><g class="ink" stroke-width="2">${inner}</g></svg>`;
}
