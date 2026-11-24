import test from 'node:test';
import assert from 'node:assert/strict';
import { BOARD, CARDS } from '../src/data.js';
import * as G from '../src/game.js';

const game = () => G.newGame([{ name: 'A', clothes: 3 }, { name: 'B', clothes: 3 }]);
const card = (pred) => CARDS.findIndex(pred);

test('tabellone da 40 caselle con titoli, angoli al posto giusto', () => {
  assert.equal(BOARD.length, 40);
  assert.ok(BOARD.every((c) => c.title && c.text));
  assert.deepEqual([0, 10, 20, 30].map((i) => BOARD[i].type), ['start', 'jail', 'relax', 'gotojail']);
});

test('libera: nessuna sfida finché non compri, poi la esegue il partner', () => {
  const s = game();
  G.roll(s, 1, 2); // A su Complimento Sincero (3)
  assert.equal(s.landing.doer, undefined);
  G.buy(s);
  assert.equal(s.owners[3], 0);
  assert.equal(s.landing.doer, 1);
  assert.equal(s.players[0].money, 1440);
});

test('affitto fisso per colore, x2 e durata x2 col colore completo; propria = al sicuro', () => {
  const s = game();
  s.owners[3] = 0;
  assert.equal(G.rent(s, 3), 20);
  s.owners[1] = 0;
  assert.equal(G.rent(s, 3), 40);
  s.turn = 1;
  G.roll(s, 1, 2); // B su proprietà di A
  assert.deepEqual([s.players[1].money, s.players[0].money], [1460, 1540]);
  assert.equal(s.landing.doer, 1);
  assert.ok(s.landing.double);
  G.endTurn(s);
  G.roll(s, 1, 2); // A sulla propria
  assert.ok(s.landing.own);
  assert.equal(s.players[0].money, 1540);
});

test('doppio rilancia, passaggio dal Via +200', () => {
  const s = game();
  s.players[0].pos = 38;
  G.roll(s, 1, 1); // 38 -> 0
  assert.equal(s.players[0].money, 1700);
  G.endTurn(s);
  assert.equal(s.turn, 0);
});

test('prigione: non si tira, si esce pagando/baciando o si salta il turno', () => {
  const s = game();
  s.players[0].pos = 25;
  G.roll(s, 2, 3); // -> 30 Vai in prigione
  assert.equal(s.players[0].pos, 10);
  assert.ok(s.players[0].inJail);
  G.endTurn(s); G.roll(s, 1, 2); G.endTurn(s); // turno di B
  G.roll(s, 3, 4);
  assert.equal(s.phase, 'roll'); // bloccato
  G.skipJail(s);
  assert.equal(s.turn, 1);
  assert.ok(!s.players[0].inJail);
  s.players[1].inJail = true;
  G.payJail(s);
  assert.equal(s.players[1].money, 1450);
  s.players[1].inJail = true;
  G.kissJail(s);
  assert.ok(!s.players[1].inJail);
});

test('carte: scelta blocca il fine turno, scudo restituisce l’affitto', () => {
  const s = game();
  s.deck = [card((c) => c.title === 'Striptease Lampo')];
  s.players[0].pos = 39;
  G.roll(s, 1, 2); // -> 2 Attività, passa dal Via
  G.endTurn(s);
  assert.equal(s.phase, 'action');
  G.choose(s, 1);
  assert.equal(s.players[0].money, 1550);
  G.endTurn(s);
  s.deck = [card((c) => c.effect?.keep === 'shield')];
  G.roll(s, 3, 4); // B -> 7 Attività
  assert.equal(G.held(s.players[1], 'shield'), 1);
  G.endTurn(s);
  s.owners[11] = 0;
  s.turn = 1;
  s.phase = 'roll';
  G.roll(s, 1, 3); // B 7 -> 11, affitto 50 ad A
  assert.equal(s.players[1].money, 1450);
  G.useShield(s, 1);
  assert.equal(s.players[1].money, 1500);
  assert.equal(G.held(s.players[1], 'shield'), 0);
});

test('carte movimento: stanza più vicina, turno extra, scambio di posto', () => {
  const s = game();
  s.deck = [card((c) => c.effect?.nearestRoom)];
  G.roll(s, 3, 4); // -> 7 Attività -> Stanza 2 (15)
  assert.equal(s.players[0].pos, 15);
  assert.ok(s.landing.canBuy);

  const t = game();
  t.deck = [card((c) => c.effect?.extra)];
  G.roll(t, 3, 4);
  G.endTurn(t);
  assert.equal(t.turn, 0);

  const u = game();
  u.players[1].pos = 3;
  u.owners[3] = 1;
  u.deck = [card((c) => c.effect?.swapPos)];
  G.roll(u, 3, 4); // A -> 7, scambia con B (3) e paga affitto
  assert.deepEqual([u.players[0].pos, u.players[1].pos], [3, 7]);
  assert.equal(u.landing.doer, 0);
  assert.equal(u.players[0].money, 1480);
});

test('soldi: tassa, multa al partner', () => {
  const s = game();
  s.deck = [card((c) => c.effect?.toPartner), card((c) => c.effect?.pay)];
  G.roll(s, 3, 4); // pesca tassa 100
  assert.equal(s.players[0].money, 1400);
  G.endTurn(s);
  s.turn = 0;
  G.roll(s, 6, 4); // 7 -> 17 Attività, multa 100 a B
  assert.deepEqual([s.players[0].money, s.players[1].money], [1300, 1600]);
});

test('cedere: entrambi pagano 300 e perdono la proprietà più cara', () => {
  const s = game();
  Object.assign(s.owners, { 1: 0, 39: 0, 6: 1 });
  G.cede(s);
  assert.deepEqual(s.owners, { 1: 0 });
  assert.equal(s.players[0].money, 1200);
});

test('senza soldi si paga in indumenti, senza vestiti è bancarotta + desiderio', () => {
  const s = game();
  s.players[0].money = 120;
  G.orgasm(s, 0); // mancano 80€ -> 2 indumenti, B riceve solo 120
  assert.deepEqual([s.players[0].money, s.players[0].clothes, s.players[1].money], [0, 1, 1620]);
  G.orgasm(s, 0); // mancano 200€ -> 4 indumenti, ne ha 1
  assert.equal(s.phase, 'over');
  assert.equal(s.winner, 1);
  assert.match(s.alert, /desiderio/);
});

test('scambio strategico: solo verso proprietà di valore uguale o superiore', () => {
  const s = game();
  Object.assign(s.owners, { 6: 0, 1: 1, 39: 1 });
  s.deck = [card((c) => c.effect?.swap)];
  G.roll(s, 1, 1); // -> 2 Attività
  G.swap(s, 6, 1); // 100 -> 60: rifiutato
  assert.equal(s.owners[6], 0);
  G.swap(s, 6, 39);
  assert.deepEqual([s.owners[6], s.owners[39]], [1, 0]);
});
