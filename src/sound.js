// Effetti sonori sintetizzati con Web Audio: nessun file da scaricare, funziona anche offline.
// Il volume è una preferenza salvata a parte dalla partita (come lo zoom).
const KEY = 'strip-street-sound';
const LEVELS = { off: 0, basso: 0.25, medio: 0.55, alto: 1 };
let level = localStorage.getItem(KEY) in LEVELS ? localStorage.getItem(KEY) : 'medio';
let ctx = null;
let out = null;
let noiseBuf = null;

export const getLevel = () => level;
export function setLevel(v) {
  level = v in LEVELS ? v : 'medio';
  localStorage.setItem(KEY, level);
  if (out) out.gain.value = LEVELS[level];
}

// Il browser blocca l'audio finché l'utente non ha toccato la pagina: prima di allora si tace
// (evita anche i suoni al ricaricamento di una partita salvata).
function audio() {
  if (!LEVELS[level]) return null;
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
  try {
    if (!ctx) {
      ctx = new AudioContext();
      out = ctx.createGain();
      out.gain.value = LEVELS[level];
      out.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; } // audio non disponibile: il gioco resta muto
}

// Nota singola con inviluppo rapido (attacco breve, coda esponenziale).
function tone(freq, at, dur, { type = 'sine', vol = 0.3, to = null } = {}) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (to) o.frequency.exponentialRampToValueAtTime(to, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(out);
  o.start(at);
  o.stop(at + dur + 0.02);
}

// Colpo di rumore filtrato: legno, carta, dadi.
function noise(at, dur, { freq = 2000, q = 1, vol = 0.3, type = 'bandpass', to = null } = {}) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, at);
  if (to) f.frequency.exponentialRampToValueAtTime(to, at + dur);
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f).connect(g).connect(out);
  src.start(at, Math.random() * 0.5);
  src.stop(at + dur + 0.02);
}

const play = (fn) => () => { if (audio()) fn(ctx.currentTime); };

const SOUNDS = {
  // dadi che rotolano nel bicchiere e si fermano sul tavolo (~1,3s, come l'animazione)
  dice: (t) => {
    for (let k = 0; k < 14; k++) {
      const at = t + k * 0.075 + Math.random() * 0.03;
      noise(at, 0.04, { freq: 2500 + Math.random() * 2500, q: 6, vol: 0.25 * (1 - k / 20) });
    }
    noise(t + 1.2, 0.06, { freq: 1800, q: 4, vol: 0.35 });
    noise(t + 1.28, 0.05, { freq: 2200, q: 4, vol: 0.25 });
  },
  // pedina che saltella di casella in casella
  step: (t) => { tone(520, t, 0.07, { type: 'triangle', vol: 0.18, to: 380 }); noise(t, 0.03, { freq: 3000, q: 3, vol: 0.08 }); },
  // carta pescata dal mazzo
  card: (t) => noise(t, 0.22, { freq: 6000, to: 1200, q: 0.8, vol: 0.22 }),
  // soldi in entrata / acquisto: ding di cassa
  coin: (t) => { tone(1319, t, 0.12, { type: 'square', vol: 0.06 }); tone(1760, t + 0.07, 0.35, { type: 'square', vol: 0.06 }); tone(2637, t + 0.07, 0.3, { vol: 0.08 }); },
  // soldi in uscita: due note che scendono
  pay: (t) => { tone(660, t, 0.14, { type: 'triangle', vol: 0.22 }); tone(440, t + 0.12, 0.25, { type: 'triangle', vol: 0.22 }); },
  // in prigione: porta che sbatte
  jail: (t) => { tone(110, t, 0.5, { type: 'sawtooth', vol: 0.2, to: 55 }); noise(t, 0.25, { freq: 400, q: 2, vol: 0.4, type: 'lowpass' }); tone(233, t + 0.02, 0.6, { type: 'square', vol: 0.04 }); },
  // fine del timer: tre rintocchi
  bell: (t) => [0, 0.35, 0.7].forEach((d) => { tone(880, t + d, 0.6, { vol: 0.3 }); tone(1760, t + d, 0.3, { vol: 0.08 }); }),
  // vittoria: arpeggio in salita
  win: (t) => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.12, i === 4 ? 0.9 : 0.3, { type: 'triangle', vol: 0.25 })),
};

export const dice = play(SOUNDS.dice);
export const step = play(SOUNDS.step);
export const card = play(SOUNDS.card);
export const coin = play(SOUNDS.coin);
export const pay = play(SOUNDS.pay);
export const jail = play(SOUNDS.jail);
export const bell = play(SOUNDS.bell);
export const win = play(SOUNDS.win);
