// Motore di gioco: solo logica, nessun DOM. Lo stato è un oggetto JSON
// (serializzabile in localStorage). Le funzioni lo mutano direttamente.
import { BOARD, CARDS, RENT, DEFAULT_RULES, GO_BONUS, JAIL_INDEX, JAIL_FINE, JAIL_KISS, CEDE_FINE, ORGASM_FINE, DEBT_STEP } from './data.js';

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// players: [{ name, clothes }]; rules: vedi DEFAULT_RULES (data.js), modificabili anche a partita in corso.
export function newGame(players, rules = DEFAULT_RULES) {
  rules = { ...DEFAULT_RULES, ...rules };
  return {
    rules,
    players: players.map(({ name, clothes }) => ({ name, clothes, money: rules.startMoney, pos: 0, inJail: false, hand: [] })),
    turn: 0,
    owners: {},            // indice casella -> indice giocatore
    deck: shuffle(CARDS.map((_, i) => i)),
    phase: 'roll',         // roll | action | over
    landing: null,         // { pos, canBuy, doer, own, rent, double, card, choice, swap }
    again: false,          // doppio o Turno Extra: rilancia
    dice: null,
    alert: null,           // messaggio importante (penitenze da debito, vittoria)
    winner: null,
    log: ['Partita iniziata.'],
  };
}

const cur = (s) => s.players[s.turn];
export const rulesOf = (s) => ({ ...DEFAULT_RULES, ...s?.rules });

// Casella effettiva: con le stanze disattivate, una stanza si comporta (e si mostra) come una casella Attività.
const ATTIVITA = BOARD.find((c) => c.type === 'card');
export const cellAt = (s, i) => (BOARD[i].type === 'room' && !rulesOf(s).rooms
  ? { ...ATTIVITA, name: BOARD[i].name.replace('Stanza', 'Attività') } : BOARD[i]);
const other = (s) => 1 - s.turn; // ponytail: sempre 2 giocatori (coppia)
const log = (s, msg) => s.log.unshift(msg);
export const held = (p, keep) => p.hand.filter((id) => CARDS[id].effect.keep === keep).length;
// le stanze disattivate non contano: restano assegnate ma tornano valide se le riattivate
export const propsOf = (s, who) => Object.keys(s.owners).map(Number).filter((pos) => s.owners[pos] === who && cellAt(s, pos).price);
const groupOf = (pos) => BOARD.map((_, i) => i).filter((i) => BOARD[i].group === BOARD[pos].group);
const fullGroup = (s, pos) => groupOf(pos).every((i) => s.owners[i] === s.owners[pos]);

// Ogni pagamento passa da qui. Se mancano soldi: saldo a 0 e ogni DEBT_STEP€ mancanti
// (arrotondati per eccesso) = un indumento tolto. Senza indumenti sufficienti: fallimento.
function transfer(s, from, to, amount) {
  if (from != null) {
    const p = s.players[from];
    const missing = amount - p.money;
    if (missing > 0) {
      const items = Math.ceil(missing / DEBT_STEP);
      amount = p.money;
      p.money = 0;
      if (items > p.clothes) return bankrupt(s, from);
      p.clothes -= items;
      s.alert = `${p.name} non ha abbastanza soldi: si toglie ${items} indumento/i al posto di ${missing}€.`;
      log(s, s.alert);
    } else p.money -= amount;
  }
  if (to != null) s.players[to].money += amount;
}

function bankrupt(s, who) {
  const [loser, winner] = [s.players[who].name, s.players[1 - who].name];
  s.phase = 'over';
  s.winner = 1 - who;
  s.landing = null;
  s.alert = `${loser} è in bancarotta: niente soldi e niente vestiti! Vince ${winner}, e ${loser} deve esaudire un suo desiderio.`;
  log(s, s.alert);
}

export function rent(s, pos) {
  const cell = BOARD[pos];
  const owned = groupOf(pos).filter((i) => s.owners[i] === s.owners[pos]).length;
  if (cell.type === 'room') return 25 * 2 ** (owned - 1);
  return RENT[cell.group] * (fullGroup(s, pos) ? 2 : 1);
}

function moveTo(s, pos, collectGo = true) {
  const p = cur(s);
  if (collectGo && pos < p.pos) {
    p.money += GO_BONUS;
    log(s, `${p.name} passa dal Via: +${GO_BONUS}€`);
  }
  p.pos = pos;
  land(s);
}

function sendToJail(s) {
  const p = cur(s);
  p.pos = JAIL_INDEX;
  p.inJail = true;
  s.again = false;
  s.landing = { ...s.landing, pos: JAIL_INDEX, doer: null };
  log(s, `${p.name} va in prigione!`);
}

function land(s) {
  const p = cur(s);
  const cell = cellAt(s, p.pos);
  s.landing = { pos: p.pos, card: s.landing?.card };
  log(s, `${p.name} arriva su ${cell.title}`);

  if (cell.type === 'prop' || cell.type === 'room') {
    const owner = s.owners[p.pos];
    if (owner == null) s.landing.canBuy = true; // la sfida scatta solo se compra
    else if (owner === s.turn) s.landing.own = true;
    else {
      // Proprietà del partner: sfida al posto dell'affitto, solo affitto o entrambi (Impostazioni).
      // Le stanze non hanno sfida: lì si paga sempre l'affitto.
      const { onOwned } = rulesOf(s);
      const challenge = cell.type === 'prop' && onOwned !== 'affitto';
      const pays = cell.type === 'room' || onOwned !== 'sfida';
      if (challenge) {
        s.landing.doer = s.turn;
        s.landing.double = fullGroup(s, p.pos);
        log(s, `${p.name} esegue la sfida di ${s.players[owner].name}${pays ? '' : ' al posto dell’affitto'}`);
      }
      if (pays) {
        const amount = rent(s, p.pos);
        s.landing.rent = { owner, amount };
        log(s, `${p.name} paga ${amount}€ di affitto a ${s.players[owner].name}`);
        transfer(s, s.turn, owner, amount);
      }
    }
    return;
  }
  if (['tax', 'bonus', 'card'].includes(cell.type)) s.landing.doer = s.turn;
  if (cell.money) p.money += cell.money;
  if (cell.type === 'gotojail') sendToJail(s);
  if (cell.type === 'card') draw(s);
}

// Senza stanze la carta "Fuga Romantica" non ha senso: si scarta e se ne pesca un'altra.
const usable = (s, id) => rulesOf(s).rooms || !CARDS[id].effect?.nearestRoom;

function draw(s) {
  let id;
  do {
    if (!s.deck.length) {
      const inHand = s.players.flatMap((p) => p.hand);
      s.deck = shuffle(CARDS.map((_, i) => i).filter((i) => !inHand.includes(i)));
    }
    id = s.deck.pop();
  } while (!usable(s, id));
  const card = CARDS[id];
  const e = card.effect || {};
  const p = cur(s);
  const q = s.players[other(s)];
  s.landing.card = id;
  log(s, `${p.name} pesca “${card.title}”: ${card.text}`);

  if (e.money) transfer(s, null, s.turn, e.money);
  if (e.pay) transfer(s, s.turn, null, e.pay);
  if (e.toPartner) transfer(s, s.turn, other(s), e.toPartner);
  if (e.fromPartner) transfer(s, other(s), s.turn, e.fromPartner);
  if (e.keep) p.hand.push(id);
  if (e.choice) s.landing.choice = e.choice;
  if (e.swap) s.landing.swap = true;
  if (e.extra) s.again = true;
  if (e.jail) sendToJail(s);
  if (e.goto != null) moveTo(s, e.goto);
  if (e.back) moveTo(s, (p.pos - e.back + BOARD.length) % BOARD.length, false);
  if (e.nearestRoom) {
    let i = (p.pos + 1) % BOARD.length;
    while (cellAt(s, i).type !== 'room') i = (i + 1) % BOARD.length;
    moveTo(s, i);
  }
  if (e.swapPos) {
    [p.pos, q.pos] = [q.pos, p.pos];
    [p.inJail, q.inJail] = [q.inJail, p.inJail];
    if (p.inJail) s.landing = { ...s.landing, pos: p.pos, doer: null };
    else land(s);
  }
}

function useCard(p, keep) {
  const i = p.hand.findIndex((id) => CARDS[id].effect.keep === keep);
  if (i < 0) return false;
  p.hand.splice(i, 1);
  return true;
}

// --- Azioni del giocatore di turno ---

export function roll(s, d1 = 1 + Math.floor(Math.random() * 6), d2 = 1 + Math.floor(Math.random() * 6)) {
  const p = cur(s);
  if (s.phase !== 'roll' || p.inJail) return; // in prigione: prima esci o salta il turno
  s.dice = [d1, d2];
  s.phase = 'action';
  s.again = d1 === d2;
  log(s, `${p.name} tira ${d1} + ${d2}`);
  moveTo(s, (p.pos + d1 + d2) % BOARD.length);
}

export function buy(s) {
  const p = cur(s);
  const cell = cellAt(s, p.pos);
  if (!s.landing?.canBuy || p.money < cell.price) return;
  transfer(s, s.turn, null, cell.price);
  s.owners[p.pos] = s.turn;
  s.landing.canBuy = false;
  if (cell.type === 'prop') s.landing.doer = other(s);
  log(s, `${p.name} compra ${cell.title} per ${cell.price}€`);
}

export function choose(s, i) {
  const opt = s.landing?.choice?.[i];
  if (!opt) return;
  s.landing.choice = null;
  log(s, `${cur(s).name} sceglie: ${opt.label}`);
  if (opt.clothes) cur(s).clothes = Math.max(0, cur(s).clothes + opt.clothes);
  if (opt.pay) transfer(s, s.turn, null, opt.pay);
}

// Carta "Scambio Strategico": dai una tua proprietà e prendi una del partner di valore uguale o superiore.
export function swap(s, mine, theirs) {
  if (!s.landing?.swap || !propsOf(s, s.turn).includes(mine) || !propsOf(s, other(s)).includes(theirs)) return;
  if (BOARD[theirs].price < BOARD[mine].price) return;
  s.owners[mine] = other(s);
  s.owners[theirs] = s.turn;
  s.landing.swap = false;
  log(s, `${cur(s).name} scambia ${BOARD[mine].title} con ${BOARD[theirs].title}`);
}

// Prigione: si esce subito pagando, con un bacio o con la carta; altrimenti si salta il turno.
function leaveJail(s, how) {
  const p = cur(s);
  if (!p.inJail || s.phase !== 'roll') return false;
  p.inJail = false;
  log(s, `${p.name} esce di prigione ${how}`);
  return true;
}

export const payJail = (s) => leaveJail(s, `pagando ${JAIL_FINE}€`) && transfer(s, s.turn, null, JAIL_FINE);
export const kissJail = (s) => leaveJail(s, `con un bacio di ${JAIL_KISS} secondi`);
export const useJailFree = (s) => held(cur(s), 'jailFree') && leaveJail(s, 'con la carta') && useCard(cur(s), 'jailFree');

export function skipJail(s) {
  if (!leaveJail(s, 'saltando il turno')) return;
  s.turn = other(s);
}

export function endTurn(s) {
  if (s.phase !== 'action' || s.landing?.choice) return;
  if (!s.again) s.turn = other(s);
  s.again = false;
  s.phase = 'roll';
  s.landing = null;
  s.alert = null;
}

// --- Regole manuali (premute dai giocatori, in qualsiasi momento) ---

// Scudo: se chi lo usa ha appena pagato un affitto, gli viene restituito; altrimenti annulla una penitenza.
export function useShield(s, who) {
  const p = s.players[who];
  if (!useCard(p, 'shield')) return;
  const r = s.landing?.rent;
  if (r && s.turn === who) {
    transfer(s, r.owner, who, r.amount);
    s.landing.rent = null;
    log(s, `${p.name} usa uno Scudo: affitto di ${r.amount}€ restituito`);
  } else log(s, `${p.name} usa uno Scudo ed evita la penitenza`);
}

// Indumenti tolti/rimessi durante le sfide: li segnano i giocatori.
export function setClothes(s, who, delta) {
  const p = s.players[who];
  p.clothes = Math.max(0, p.clothes + delta);
}

// Toccato o guardato il partner in prigione: 50€ (oppure penitenza, a voce).
export function jailFine(s, who) {
  log(s, `${s.players[who].name} paga ${JAIL_FINE}€ di multa in prigione`);
  transfer(s, who, null, JAIL_FINE);
}

// Penetrazione fuori dalla casella 40: entrambi pagano 300€ e perdono la proprietà più costosa.
export function cede(s) {
  log(s, `Avete ceduto! Entrambi pagate ${CEDE_FINE}€`);
  s.players.forEach((p, i) => {
    if (s.phase === 'over') return;
    transfer(s, i, null, CEDE_FINE);
    const mine = propsOf(s, i);
    if (mine.length) {
      const top = mine.reduce((a, b) => (BOARD[b].price > BOARD[a].price ? b : a));
      delete s.owners[top];
      log(s, `${p.name} perde ${BOARD[top].title}`);
    }
  });
}

export function orgasm(s, who) {
  log(s, `${s.players[who].name} paga ${ORGASM_FINE}€ a ${s.players[1 - who].name}`);
  transfer(s, who, 1 - who, ORGASM_FINE);
}
