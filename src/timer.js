// Timer delle sfide a tempo, con anello di avanzamento. Vive fuori dallo stato di gioco
// (non si salva): ricaricando la pagina il timer riparte da zero.
const el = document.getElementById('timer');
const R = 42;
const C = 2 * Math.PI * R;
let left = 0;
let total = 0;
let tick = null;

export const fmt = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

function beep() {
  try {
    const ctx = new AudioContext();
    [0, 0.3, 0.6].forEach((t) => {
      const o = ctx.createOscillator();
      o.frequency.value = 880;
      o.connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.2);
    });
  } catch { /* audio non disponibile: resta il messaggio a schermo */ }
  navigator.vibrate?.([300, 100, 300]);
}

function build() {
  el.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="track" cx="50" cy="50" r="${R}"/>`
    + `<circle class="bar" cx="50" cy="50" r="${R}" stroke-dasharray="${C}"/></svg>`
    + '<div class="time"></div><div class="row"><button class="toggle"></button><button class="stop">Stop</button></div>';
  el.querySelector('.stop').onclick = stop;
  el.querySelector('.toggle').onclick = () => (tick ? pause() : resume());
}

function show(done = false) {
  el.hidden = false;
  el.classList.toggle('done', done);
  el.querySelector('.bar').style.strokeDashoffset = C * (1 - left / total);
  el.querySelector('.time').textContent = done ? 'Tempo!' : fmt(left);
  const t = el.querySelector('.toggle');
  t.hidden = done;
  t.textContent = tick ? 'Pausa' : 'Riprendi';
  el.querySelector('.stop').textContent = done ? 'Chiudi' : 'Stop';
}

function resume() {
  clearInterval(tick);
  tick = setInterval(() => {
    left--;
    if (left > 0) return show();
    clearInterval(tick);
    tick = null;
    beep();
    show(true);
  }, 1000);
  show();
}

function pause() {
  clearInterval(tick);
  tick = null;
  show();
}

export function start(sec) {
  left = total = sec;
  build();
  resume();
}

export function stop() {
  clearInterval(tick);
  tick = null;
  left = 0;
  el.hidden = true;
}
