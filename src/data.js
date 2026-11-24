// Contenuti del gioco: unica fonte di verità per tabellone e carte.
// Modificare testi/prezzi qui, il motore (game.js) non va toccato.

export const START_MONEY = 1500;
export const GO_BONUS = 200;
export const JAIL_INDEX = 10;
export const JAIL_FINE = 50;
export const JAIL_KISS = 15;    // secondi di bacio per uscire di prigione
export const CEDE_FINE = 300;   // regola penetrazione fuori casella 40
export const ORGASM_FINE = 200; // pagati al partner
export const DEBT_STEP = 50;    // senza soldi: ogni 50€ mancanti = un indumento tolto

// Affitto fisso per colore (x2 col colore completo, che raddoppia anche la durata della sfida).
// Stanze: 25/50/100/200€ in base a quante ne possiede il proprietario.
export const RENT = { marrone: 20, azzurro: 35, rosa: 50, arancione: 65, rosso: 80, giallo: 95, verde: 110, blu: 150 };

// Regole scelte in Impostazioni (default per le nuove partite):
// - onOwned: cosa succede sulla proprietà del partner: 'sfida' (esegui la sfida al posto dell'affitto),
//   'affitto' (paghi soltanto) oppure 'entrambi'. Le stanze non hanno sfida: lì si paga sempre l'affitto.
// - rooms: false = le 4 stanze diventano caselle Attività (si pesca una carta).
// - startMoney: soldi con cui parte ciascun giocatore (conta solo all'inizio della partita).
export const DEFAULT_RULES = { onOwned: 'sfida', rooms: true, startMoney: START_MONEY };

// Chi esegue la sfida:
// - proprietà libera: se la compri paghi tu e la sfida la esegue il partner; se non compri non succede nulla
// - proprietà del partner: la sfida la esegui tu (al posto dell'affitto, o insieme, secondo le regole)
// - proprietà tua: sei al sicuro (se volete potete ripeterla)
// - tasse, bonus, carte: esegue chi ci arriva
// I testi sono scritti in seconda persona: "tu" = chi esegue.

// Nomi dei 4 lati del tabellone (10 caselle ciascuno, angolo compreso): titoli della pagina Caselle.
export const SIDES = ['Partenza & Atmosfera', 'Contatto & Sensualità', 'Provocazione & Gioco', 'Alta Intensità & Gran Finale'];

// icon: nome icona Lucide (https://lucide.dev/icons). title: nome mostrato. name: posizione/colore. timer: secondi della sfida a tempo.
// type: start | prop | room | card | tax | bonus | jail | relax | gotojail
export const BOARD = [
  // Lato 1 – Partenza & Atmosfera
  { icon: 'ArrowLeft', type: 'start', name: 'Angolo', title: 'Via!', text: 'Ritiri 200€ ogni volta che passi da qui.' },
  { icon: 'Eye', type: 'prop', group: 'marrone', name: 'Marrone 1', title: 'Sguardo Magnetico', price: 60, timer: 30, text: 'Guardatevi negli occhi per 30 secondi. Chi ride o distoglie lo sguardo per primo fa una penitenza scelta dall’altro.' },
  { icon: 'Sparkles', type: 'card', name: 'Attività', title: 'Attività', text: 'Pesca una carta.' },
  { icon: 'MessageCircleHeart', type: 'prop', group: 'marrone', name: 'Marrone 2', title: 'Complimento Sincero', price: 60, text: 'Fai al partner tre complimenti sinceri: sul suo corpo, sul suo carattere, su quello che vuoi.' },
  { icon: 'Heart', type: 'tax', name: 'Tassa', title: 'Tassa Romantica', text: 'Bacio a scelta del partner.' },
  { icon: 'Sofa', type: 'room', group: 'stanza', name: 'Stanza 1', title: 'Il Divano', price: 200, text: 'Chi possiede una stanza può spostarci l’azione di qualsiasi sfida.' },
  { icon: 'MessageCircleQuestion', type: 'prop', group: 'azzurro', name: 'Azzurro 1', title: 'Tre Domande', price: 100, text: 'Il partner ti fa tre domande intime: rispondi a tutte con sincerità.' },
  { icon: 'Sparkles', type: 'card', name: 'Attività', title: 'Attività', text: 'Pesca una carta.' },
  { icon: 'Speech', type: 'prop', group: 'azzurro', name: 'Azzurro 2', title: 'Sussurro Audace', price: 100, text: 'Sussurra all’orecchio del partner una cosa che vorresti fare stasera.' },
  { icon: 'WandSparkles', type: 'prop', group: 'azzurro', name: 'Azzurro 3', title: 'Desiderio Segreto', price: 120, text: 'Confessa al partner un desiderio che non gli hai mai detto.' },
  // Lato 2 – Contatto & Sensualità
  { icon: 'Lock', type: 'jail', name: 'Angolo', title: 'Prigione', text: 'Se ci sei solo di passaggio non succede nulla. In prigione non puoi toccare né guardare il partner: se lo fai, penitenza scelta dal partner oppure paghi 50€.' },
  { icon: 'Hand', type: 'prop', group: 'rosa', name: 'Rosa 1', title: 'Mani di Velluto', price: 140, timer: 60, text: 'Fai al partner un massaggio dove preferisce, per 1 minuto.' },
  { icon: 'Zap', type: 'bonus', name: 'Bonus', title: 'Bonus Energia', timer: 60, text: 'Massaggio di 1 minuto in una parte intima a scelta.' },
  { icon: 'EyeOff', type: 'prop', group: 'rosa', name: 'Rosa 2', title: 'Carezze al Buio', price: 140, timer: 60, text: 'Bendati: per 1 minuto il partner ti accarezza come vuole.' },
  { icon: 'Target', type: 'prop', group: 'rosa', name: 'Rosa 3', title: 'Punto Debole', price: 160, timer: 60, text: 'Dì al partner qual è il tuo punto debole: per 1 minuto può baciarlo e toccarlo come vuole.' },
  { icon: 'ChefHat', type: 'room', group: 'stanza', name: 'Stanza 2', title: 'La Cucina', price: 200, text: 'Chi possiede una stanza può spostarci l’azione di qualsiasi sfida.' },
  { icon: 'Hourglass', type: 'prop', group: 'arancione', name: 'Arancione 1', title: 'Bacio al Rallentatore', price: 180, timer: 30, text: 'Dai al partner un bacio lentissimo, senza fermarti, per 30 secondi.' },
  { icon: 'Sparkles', type: 'card', name: 'Attività', title: 'Attività', text: 'Pesca una carta.' },
  { icon: 'Ban', type: 'prop', group: 'arancione', name: 'Arancione 2', title: 'Senza Mani', price: 180, timer: 60, text: 'Il partner si siede sopra di te: per 1 minuto non puoi toccarlo né baciarlo.' },
  { icon: 'Shirt', type: 'prop', group: 'arancione', name: 'Arancione 3', title: 'Un Capo in Meno', price: 200, text: 'Togliti l’indumento che sceglie il partner.' },
  // Lato 3 – Provocazione & Gioco
  { icon: 'Martini', type: 'relax', name: 'Angolo', title: 'Zona Franca', timer: 60, text: 'Riposatevi 1 minuto, bevete qualcosa e scambiatevi un complimento.' },
  { icon: 'Glasses', type: 'prop', group: 'rosso', name: 'Rosso 1', title: 'Cambio Look', price: 220, text: 'Il partner decide: ti toglie un indumento oppure ti fa indossare qualcosa a sua scelta.' },
  { icon: 'Sparkles', type: 'card', name: 'Attività', title: 'Attività', text: 'Pesca una carta.' },
  { icon: 'Feather', type: 'prop', group: 'rosso', name: 'Rosso 2', title: 'Esplorazione Sensoriale', price: 220, timer: 60, text: 'Benda il partner e bacialo dove vuoi, con labbra e lingua, per 1 minuto.' },
  { icon: 'Ear', type: 'prop', group: 'rosso', name: 'Rosso 3', title: 'Bendato', price: 240, timer: 30, text: 'Benda il partner e giocagli con l’orecchio (baci, morsi, sussurri) per 30 secondi.' },
  { icon: 'ShowerHead', type: 'room', group: 'stanza', name: 'Stanza 3', title: 'La Doccia', price: 200, text: 'Chi possiede una stanza può spostarci l’azione di qualsiasi sfida.' },
  { icon: 'Link', type: 'prop', group: 'giallo', name: 'Giallo 1', title: 'Mani Legate', price: 260, text: 'Il partner ti lega i polsi: restano legati fino al tuo prossimo turno.' },
  { icon: 'Crown', type: 'prop', group: 'giallo', name: 'Giallo 2', title: 'Ordine Diretto', price: 260, timer: 120, text: 'Il partner ti dà un ordine: eseguilo per 2 minuti.' },
  { icon: 'Music', type: 'bonus', name: 'Bonus', title: 'Bonus Atmosfera', money: 200, text: 'Scegli la musica di sottofondo e incassi 200€.' },
  { icon: 'Ribbon', type: 'prop', group: 'giallo', name: 'Giallo 3', title: 'Nodo Stretto', price: 280, text: 'Togliti un indumento e usalo per legare i polsi del partner fino al suo prossimo turno.' },
  // Lato 4 – Alta Intensità & Gran Finale
  { icon: 'Siren', type: 'gotojail', name: 'Angolo', title: 'Vai in Prigione!', text: 'Vai in prigione senza passare dal Via.' },
  { icon: 'Droplet', type: 'prop', group: 'verde', name: 'Verde 1', title: 'Massaggio con Olio', price: 300, timer: 120, text: 'Fai al partner un massaggio con l’olio, dove preferisce, per 2 minuti.' },
  { icon: 'Vibrate', type: 'prop', group: 'verde', name: 'Verde 2', title: 'Vibrazioni', price: 300, timer: 60, text: 'Per 1 minuto il partner usa su di te il vibratore che preferisce.' },
  { icon: 'Sparkles', type: 'card', name: 'Attività', title: 'Attività', text: 'Pesca una carta.' },
  { icon: 'Moon', type: 'prop', group: 'verde', name: 'Verde 3', title: 'Sotto le Coperte', price: 320, timer: 120, text: 'Infilatevi sotto le coperte: per 2 minuti fai al partner ciò che ti chiede.' },
  { icon: 'BedDouble', type: 'room', group: 'stanza', name: 'Stanza 4', title: 'Camera da Letto', price: 200, text: 'Chi possiede una stanza può spostarci l’azione di qualsiasi sfida.' },
  { icon: 'Sparkles', type: 'card', name: 'Attività', title: 'Attività', text: 'Pesca una carta.' },
  { icon: 'Cherry', type: 'prop', group: 'blu', name: 'Blu 1', title: 'Dolce Tentazione', price: 350, timer: 120, text: 'Fai sesso orale al partner per 2 minuti.' },
  { icon: 'Infinity', type: 'tax', name: 'Tassa', title: 'Carta Bianca', text: 'Libera scelta su cosa fare al partner.' },
  { icon: 'Flame', type: 'prop', group: 'blu', name: 'Blu 2', title: 'Il Premio Finale', price: 400, text: 'Penetrazione, nella posizione che sceglie il partner. È l’unica casella in cui è permessa.' },
];

// kind: colpo | jolly | soldi | riscatto (serve alla grafica, non al motore)
// effect:
//   { money } incassi dalla banca | { pay } paghi alla banca | { toPartner } | { fromPartner }
//   { goto } | { back } | { jail } | { nearestRoom } | { extra } turno extra | { swapPos } scambio di posto
//   { swap } scambio proprietà | { keep: 'jailFree'|'shield' } | { choice: [{label, pay?, clothes?}] }
export const CARDS = [
  // Colpo di scena: movimento e regole
  { kind: 'colpo', title: 'Cambio di Ruolo', text: 'Nella prossima sfida chi agisce e chi subisce si scambiano.' },
  { kind: 'colpo', title: 'Scambio Strategico', text: 'Scambia una tua proprietà con una del partner di valore uguale o superiore.', effect: { swap: true } },
  { kind: 'colpo', title: 'Scambio di Posto', text: 'Scambia la tua posizione con quella del partner ed esegui la casella su cui si trovava.', effect: { swapPos: true } },
  { kind: 'colpo', title: 'Passo Indietro', text: 'Torna indietro di 3 caselle.', effect: { back: 3 } },
  { kind: 'colpo', title: 'Avanza fino al Via', text: 'Vai al Via! e ritira 200€.', effect: { goto: 0 } },
  { kind: 'colpo', title: 'Fuga Romantica', text: 'Avanza fino alla stanza più vicina. Se è libera puoi comprarla.', effect: { nearestRoom: true } },
  { kind: 'colpo', title: 'Turno Extra', text: 'Dopo questo turno lanci di nuovo i dadi.', effect: { extra: true } },
  { kind: 'colpo', title: 'Vai in Prigione', timer: 120, text: 'Vai in prigione: il partner ti lega le mani e può fare ciò che vuole per 2 minuti.', effect: { jail: true } },
  // Jolly: si tengono in mano
  { kind: 'jolly', title: 'Esci di Prigione', text: 'Esci gratis di prigione. Tienila finché ti serve.', effect: { keep: 'jailFree' } },
  { kind: 'jolly', title: 'Massaggio Liberatorio', timer: 120, text: 'Fai un massaggio di 2 minuti al partner: potrai usare questa carta per uscire di prigione quando vuoi.', effect: { keep: 'jailFree' } },
  { kind: 'jolly', title: 'Scudo', text: 'Annulla una penitenza, oppure fatti restituire l’affitto appena pagato. Tienila finché ti serve.', effect: { keep: 'shield' } },
  { kind: 'jolly', title: 'Scudo', text: 'Annulla una penitenza, oppure fatti restituire l’affitto appena pagato. Tienila finché ti serve.', effect: { keep: 'shield' } },
  // Soldi
  { kind: 'soldi', title: 'Serata Perfetta', text: 'Il tuo fascino colpisce nel segno: incassi 150€ dalla banca.', effect: { money: 150 } },
  { kind: 'soldi', title: 'Multa per Timidezza', text: 'Hai esitato troppo: paghi 100€ al partner.', effect: { toPartner: 100 } },
  { kind: 'soldi', title: 'Tassa di Lusso', text: 'Hai speso troppo per preparare l’atmosfera: paghi 100€ alla banca.', effect: { pay: 100 } },
  { kind: 'soldi', title: 'Buon Compleanno', text: 'È il tuo compleanno! Il partner ti dà 100€ (se non li ha, paga in indumenti).', effect: { fromPartner: 100 } },
  // Riscatto: azioni, alcune con alternativa in denaro
  { kind: 'riscatto', title: 'Striptease Lampo', text: 'Togli un capo oppure paga 150€.', effect: { choice: [{ label: 'Tolgo un capo', clothes: -1 }, { label: 'Pago 150€', pay: 150 }] } },
  { kind: 'riscatto', title: 'Verità Scomoda', text: 'Rispondi con totale sincerità a una domanda intima del partner, oppure paga 100€.', effect: { choice: [{ label: 'Rispondo' }, { label: 'Pago 100€', pay: 100 }] } },
  { kind: 'riscatto', title: 'Giocattolo', text: 'Indossa per un turno intero uno dei vostri giochi, scelto dal partner.' },
  { kind: 'riscatto', title: 'Spese Ospedaliere', text: 'Pagale con una lap dance.' },
  { kind: 'riscatto', title: 'Tasse Scolastiche', text: 'Pagale leccando l’orecchio del partner.' },
  { kind: 'riscatto', title: 'Ancora Compleanno', text: 'Togli un indumento al partner.' },
  { kind: 'riscatto', title: 'Rivestiti', text: 'Rimettiti un indumento.' },
  { kind: 'riscatto', title: 'Tutto Indietro', text: 'Puoi rimetterti tutti i vestiti. Se non vuoi, non farlo.' },
  { kind: 'riscatto', title: 'Scia di Baci', timer: 180, text: 'Baci sul corpo per 3 minuti.' },
  { kind: 'riscatto', title: 'Brindisi', text: 'Bevi 2 sorsi.' },
  { kind: 'riscatto', title: 'Scambio Intimo', text: 'Scambiatevi la biancheria intima.' },
  { kind: 'riscatto', title: 'Un Capo in Meno', text: 'Togli un indumento.' },
  { kind: 'riscatto', title: 'Spogliarello', text: 'Togli 5 indumenti.' },
];