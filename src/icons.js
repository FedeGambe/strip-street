// Icone Lucide usate nel gioco. Importate una per una così il bundle resta piccolo:
// per aggiungerne una, importarla qui e usarne il nome in data.js.
import {
  createElement, ArrowLeft, Eye, Sparkles, MessageCircleHeart, Heart, Sofa, Speech,
  WandSparkles, Lock, Hand, Zap, EyeOff, Target, ChefHat, Hourglass, Ban, Shirt, Martini, Glasses, Feather,
  Ear, ShowerHead, Link, Crown, Music, Ribbon, Siren, Droplet, Vibrate, Moon, BedDouble, Cherry, Infinity,
  Flame, Shuffle, Shield, Coins, KeyRound, Timer, Cookie,
} from 'lucide';

const ICONS = {
  ArrowLeft, Eye, Sparkles, MessageCircleHeart, Heart, Sofa, Speech, WandSparkles, Lock,
  Hand, Zap, EyeOff, Target, ChefHat, Hourglass, Ban, Shirt, Martini, Glasses, Feather, Ear, ShowerHead, Link,
  Crown, Music, Ribbon, Siren, Droplet, Vibrate, Moon, BedDouble, Cherry, Infinity, Flame, Shuffle, Shield,
  Coins, KeyRound, Timer, Cookie,
};

// Restituisce l'SVG come stringa, da inserire in un template HTML.
export const icon = (name, cls = 'ico') =>
  createElement(ICONS[name] || Sparkles, { class: cls, 'aria-hidden': 'true', 'stroke-width': 1.6 }).outerHTML;
