// Sottopagine raggiungibili dall'header (#caselle, #carte, #guida): elenco delle caselle, delle carte e guida.
// Solo lettura dei dati di data.js: la partita in corso resta salvata e si riprende tornando a #.
import { BOARD, CARDS, RENT, SIDES, START_MONEY, GO_BONUS, JAIL_FINE, JAIL_KISS, CEDE_FINE, ORGASM_FINE, DEBT_STEP } from './data.js';
import { KIND, propCard, actCard } from './cards.js';

export const PAGES = { caselle: 'Caselle', carte: 'Carte', guida: 'Guida' };

const GROUP = { marrone: 'Marrone', azzurro: 'Azzurro', rosa: 'Rosa', arancione: 'Arancione', rosso: 'Rosso', giallo: 'Giallo', verde: 'Verde', blu: 'Blu' };
const tile = (face, caption) => `<figure class="tile"><div class="tile-card">${face}</div><figcaption>${caption}</figcaption></figure>`;
const head = (title, lead) => `<header class="page-head"><h2>${title}</h2><p>${lead}</p></header>`;

function caselle() {
  const props = Object.keys(RENT).map((g) => {
    const cells = BOARD.map((c, i) => ({ ...c, i })).filter((c) => c.group === g);
    const prices = [...new Set(cells.map((c) => c.price))].join(' / ');
    return `<tr><th scope="row"><span class="swatch" style="--g: var(--${g})"></span>${GROUP[g]}</th>`
      + `<td>${cells.map((c) => `${c.title} <small>(${c.i + 1})</small>`).join(', ')}</td>`
      + `<td class="num">${prices}€</td><td class="num">${RENT[g]}€</td><td class="num">${RENT[g] * 2}€</td></tr>`;
  }).join('');
  const rooms = BOARD.map((c, i) => ({ ...c, i })).filter((c) => c.type === 'room');
  const table = '<section class="sheet box"><h3>Proprietà e affitti</h3>'
    + '<div class="scroll"><table><thead><tr><th scope="col">Colore</th><th scope="col">Caselle</th><th scope="col" class="num">Prezzo</th>'
    + '<th scope="col" class="num">Affitto</th><th scope="col" class="num">Colore completo</th></tr></thead>'
    + `<tbody>${props}<tr><th scope="row"><span class="swatch" style="--g: var(--stanza)"></span>Stanze</th>`
    + `<td>${rooms.map((c) => `${c.title} <small>(${c.i + 1})</small>`).join(', ')}</td><td class="num">${rooms[0].price}€</td>`
    + '<td class="num" colspan="2">25 · 50 · 100 · 200€ con 1–4 stanze</td></tr></tbody></table></div>'
    + '<p class="muted small">Col colore completo raddoppiano sia l’affitto sia la durata della sfida. '
    + 'Di default sulla proprietà del partner si esegue la sfida al posto dell’affitto: l’affitto si attiva in Impostazioni.</p></section>';
  const sides = SIDES.map((name, n) => `<section><h3 class="side-title"><span>Lato ${n + 1}</span>${name}</h3><div class="tiles">`
    + BOARD.slice(n * 10, n * 10 + 10).map((c, k) => {
      const i = n * 10 + k;
      return tile(propCard(c), `Casella ${i + 1}${c.timer ? ` · ⏱ ${c.timer}s` : ''}`);
    }).join('') + '</div></section>').join('');
  return head('Le caselle', `Le ${BOARD.length} caselle del tabellone, nell’ordine in cui le percorre la pedina partendo dal Via.`) + table + sides;
}

const KIND_DESC = {
  colpo: 'Ti spostano sul tabellone o cambiano le regole del turno.',
  jolly: 'Si tengono in mano e si giocano quando servono.',
  soldi: 'Denaro che entra o esce, dalla banca o dal partner.',
  riscatto: 'Azioni da fare subito: alcune si possono riscattare pagando.',
};

function carte() {
  // carte identiche (stesso titolo e testo) mostrate una volta sola, con le copie nel mazzo
  const seen = new Map();
  CARDS.forEach((c) => { const k = `${c.title}|${c.text}`; seen.set(k, { c, n: (seen.get(k)?.n || 0) + 1 }); });
  const unique = [...seen.values()];
  const kinds = Object.keys(KIND).map((kind) => {
    const list = unique.filter(({ c }) => c.kind === kind);
    const total = list.reduce((sum, { n }) => sum + n, 0);
    return `<section><h3 class="side-title kind-${kind}"><span>${total} carte</span>${KIND[kind]}</h3><p class="kind-desc">${KIND_DESC[kind]}</p>`
      + `<div class="tiles">${list.map(({ c, n }) => tile(actCard(c), [n > 1 ? `×${n} nel mazzo` : '', c.timer ? `⏱ ${c.timer}s` : ''].filter(Boolean).join(' · ') || '&nbsp;')).join('')}</div></section>`;
  }).join('');
  return head('Le carte Attività', `Il mazzo ha ${CARDS.length} carte: se ne pesca una ogni volta che si finisce su una casella Attività. Quando il mazzo finisce si rimescola.`) + kinds;
}

const section = (title, body) => `<section><h3>${title}</h3>${body}</section>`;
const list = (items) => `<ul>${items.map((t) => `<li>${t}</li>`).join('')}</ul>`;

function guida() {
  return head('Guida al gioco', 'Come si gioca a Strip Street, passo per passo.') + '<article class="sheet box guide">'
    + section('Prima di iniziare', '<p>Strip Street è un gioco per coppie di adulti consenzienti. Mettetevi d’accordo sui limiti prima di cominciare: '
      + 'ogni sfida si può fermare in qualsiasi momento, e una parola di stop vale più di qualunque regola.</p>'
      + `<p>Ognuno parte con <b>${START_MONEY}€</b> (la cifra si cambia all’avvio della partita o in Impostazioni) e indica quanti indumenti indossa: servono a pagare i debiti quando finiscono i soldi.</p>`)
    + section('Lo scopo', '<p>Girate sul tabellone, comprate proprietà e incassate affitti. Chi deve pagare senza più soldi né vestiti '
      + 'va in <b>bancarotta</b>: l’altro vince, e chi perde esaudisce un suo desiderio.</p>')
    + section('Il turno', list([
      'Lancia i dadi: la pedina avanza della somma.',
      `Ogni volta che passi dal <b>Via!</b> ritiri ${GO_BONUS}€.`,
      'Esegui quello che dice la casella su cui arrivi, poi premi <b>Fatto · fine turno</b>.',
      'Con un <b>doppio</b> lanci di nuovo dopo aver finito il turno.',
    ]))
    + section('Proprietà e sfide: chi esegue?', list([
      '<b>Proprietà libera</b>: puoi comprarla. Se la compri paghi tu e la sfida la esegue il partner; se non compri non succede nulla.',
      '<b>Proprietà del partner</b>: esegui tu la sfida, <b>al posto dell’affitto</b>. In Impostazioni potete scegliere di pagare solo l’affitto, oppure affitto e sfida insieme.',
      '<b>Proprietà tua</b>: sei al sicuro (se volete potete ripeterla).',
      '<b>Tasse, bonus e carte</b>: esegue chi ci arriva.',
    ]) + '<p>I testi delle caselle sono scritti in seconda persona: “tu” è sempre chi esegue.</p>')
    + section('Affitti e stanze', list([
      'Ogni colore ha un affitto fisso, che si paga solo se in Impostazioni l’affitto è attivo. Con tutte le proprietà dello stesso colore l’affitto <b>raddoppia</b>, e raddoppia anche la durata della sfida.',
      'Le quattro <b>stanze</b> non hanno sfide: lì si paga sempre l’affitto, 25, 50, 100 o 200€ a seconda di quante ne possiede il proprietario.',
      'Chi possiede una stanza può spostarci l’azione di qualsiasi sfida.',
      'In Impostazioni potete <b>disattivare le stanze</b>: diventano caselle Attività e si pesca una carta.',
    ]) + '<p>Prezzi e affitti di ogni casella sono nella pagina <a href="#caselle">Caselle</a>.</p>')
    + section('Carte Attività', '<p>Sulle caselle Attività peschi una carta. Ce ne sono di quattro tipi: <b>Colpo di scena</b> (movimento e regole), '
      + '<b>Jolly</b> (da tenere in mano), <b>Soldi</b> e <b>Riscatto</b> (azioni, a volte riscattabili pagando). '
      + 'Le trovi tutte nella pagina <a href="#carte">Carte</a>.</p>')
    + section('Prigione', list([
      'Ci finisci arrivando su <b>Vai in Prigione!</b> o con una carta, senza passare dal Via. Il doppio non vale più.',
      `Al tuo turno puoi uscire subito pagando <b>${JAIL_FINE}€</b>, con un <b>bacio di ${JAIL_KISS} secondi</b> o con la carta <b>Esci di prigione</b>; altrimenti salti il turno.`,
      `In prigione non puoi toccare né guardare il partner: se lo fai, penitenza scelta dal partner oppure paghi ${JAIL_FINE}€.`,
      'Se ci arrivi solo di passaggio non succede nulla.',
    ]))
    + section('Quando finiscono i soldi', `<p>Se devi pagare e non hai abbastanza soldi, il saldo va a zero e per ogni <b>${DEBT_STEP}€</b> mancanti `
      + '(arrotondati per eccesso) ti togli un indumento. Se gli indumenti non bastano, è bancarotta.</p>')
    + section('Regole speciali', list([
      `<b>Orgasmo</b>: chi raggiunge l’orgasmo paga ${ORGASM_FINE}€ al partner.`,
      `<b>Il Premio Finale</b> (casella 40) è l’unica in cui è permessa la penetrazione. Se cedete altrove pagate entrambi ${CEDE_FINE}€ e perdete la proprietà più costosa.`,
      '<b>Scudo</b>: annulla una penitenza, oppure ti fa restituire l’affitto appena pagato.',
    ]) + '<p>Questi eventi li segnate voi dal pannello <b>Regole manuali</b> sul tavolo, insieme agli indumenti tolti o rimessi durante le sfide.</p>')
    + section('Usare l’app', list([
      'Passa sopra una casella (o toccala) per vederne testo, affitto e proprietario.',
      'Le sfide a tempo hanno il pulsante del timer; un timer libero è in <b>Impostazioni</b>.',
      'Le <b>regole</b> (affitto, sfida o entrambi; stanze attive o no) si scelgono all’avvio della partita e si possono cambiare in Impostazioni, dove trovi anche lo <b>zoom</b> sul lato del giocatore di turno.',
      'Durante la partita la barra in alto si apre con la linguetta <b>Mostra</b>.',
      'La partita resta salvata sul dispositivo: puoi aprire Caselle, Carte e Guida e tornare al <a href="#">Gioco</a> senza perderla.',
      'Sul telefono puoi aggiungere Strip Street alla schermata Home e usarla come un’app.',
    ]))
    + '</article>';
}

export const renderPage = (name) => `<div class="page-inner">${{ caselle, carte, guida }[name]()}</div>`;
