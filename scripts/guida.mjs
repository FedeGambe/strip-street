// Genera la guida del gioco: doc/guida.md (dai dati di src/data.js, così cifre, caselle e carte restano allineate)
// e doc/guida.pdf (il Markdown convertito in HTML con lo stile del marchio e stampato da Chrome/Edge headless).
// Uso: `npm run guida`. Non serve il server di sviluppo. Browser diverso: BROWSER=/percorso npm run guida
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  BOARD, CARDS, RENT, SIDES, DEFAULT_RULES, START_MONEY, GO_BONUS, JAIL_FINE, JAIL_KISS, CEDE_FINE, ORGASM_FINE, DEBT_STEP,
} from '../src/data.js';

const GROUP = { marrone: 'Marrone', azzurro: 'Azzurro', rosa: 'Rosa', arancione: 'Arancione', rosso: 'Rosso', giallo: 'Giallo', verde: 'Verde', blu: 'Blu' };
const KIND = { colpo: 'Colpo di scena', jolly: 'Jolly', soldi: 'Soldi', riscatto: 'Riscatto' };
const KIND_DESC = {
  colpo: 'Ti spostano sul tabellone o cambiano le regole del turno.',
  jolly: 'Si tengono in mano e si giocano quando servono.',
  soldi: 'Denaro che entra o esce, dalla banca o dal partner.',
  riscatto: 'Azioni da fare subito: alcune si possono riscattare pagando.',
};
const TYPE = { start: 'Angolo', jail: 'Angolo', relax: 'Angolo', gotojail: 'Angolo', card: 'Attività', tax: 'Tassa', bonus: 'Bonus', room: 'Stanza' };
const ON_OWNED = { sfida: 'esegui la sfida, niente affitto', affitto: 'paghi solo l’affitto', entrambi: 'paghi l’affitto ed esegui la sfida' };
const cell = (t) => String(t).replace(/\|/g, '\\|');
const time = (s) => (s >= 60 ? `${s / 60} min` : `${s} s`);

// --- Markdown ---

const rooms = BOARD.map((c, i) => ({ ...c, n: i + 1 })).filter((c) => c.type === 'room');
const rentTable = [
  '| Colore | Caselle | Prezzo | Affitto | Colore completo |',
  '| --- | --- | ---: | ---: | ---: |',
  ...Object.keys(RENT).map((g) => {
    const cells = BOARD.map((c, i) => ({ ...c, n: i + 1 })).filter((c) => c.group === g);
    return `| ${GROUP[g]} | ${cells.map((c) => `${c.title} (${c.n})`).join(', ')} | ${[...new Set(cells.map((c) => c.price))].join(' / ')}€ | ${RENT[g]}€ | ${RENT[g] * 2}€ |`;
  }),
  `| Stanze | ${rooms.map((c) => `${c.title} (${c.n})`).join(', ')} | ${rooms[0].price}€ | 25 · 50 · 100 · 200€ | con 1–4 stanze |`,
].join('\n');

const sides = SIDES.map((name, s) => [
  `### Lato ${s + 1} · ${name}`,
  '',
  '| N. | Casella | Tipo | Prezzo | Cosa fare |',
  '| ---: | --- | --- | ---: | --- |',
  ...BOARD.slice(s * 10, s * 10 + 10).map((c, k) => {
    const type = c.type === 'prop' ? GROUP[c.group] : TYPE[c.type];
    const timer = c.timer ? ` ⏱ ${time(c.timer)}` : '';
    return `| ${s * 10 + k + 1} | **${cell(c.title)}** | ${type} | ${c.price ? `${c.price}€` : ''} | ${cell(c.text)}${timer} |`;
  }),
].join('\n')).join('\n\n');

const cards = Object.keys(KIND).map((kind) => {
  const seen = new Map();
  CARDS.filter((c) => c.kind === kind).forEach((c) => {
    const k = `${c.title}|${c.text}`;
    seen.set(k, { c, n: (seen.get(k)?.n || 0) + 1 });
  });
  const total = [...seen.values()].reduce((a, { n }) => a + n, 0);
  return [
    `### ${KIND[kind]} · ${total} carte`,
    '',
    KIND_DESC[kind],
    '',
    '| Carta | Cosa fare |',
    '| --- | --- |',
    ...[...seen.values()].map(({ c, n }) => `| **${cell(c.title)}**${n > 1 ? ` ×${n}` : ''} | ${cell(c.text)}${c.timer ? ` ⏱ ${time(c.timer)}` : ''} |`),
  ].join('\n');
}).join('\n\n');

const md = `# Strip Street · Guida al gioco

Il gioco da tavolo per coppie. Solo per adulti consenzienti (18+).

Si gioca in due, su un solo dispositivo condiviso oppure con la versione stampata. Questa guida spiega le regole passo per passo; in fondo trovi l’elenco completo delle caselle e delle carte.

## Prima di iniziare

Strip Street è un gioco per coppie di adulti consenzienti. Mettetevi d’accordo sui limiti prima di cominciare: ogni sfida si può fermare in qualsiasi momento, e una parola di stop vale più di qualunque regola.

## Preparazione

1. Scrivete i vostri nomi e quanti **indumenti** indossa ognuno: servono a pagare i debiti quando finiscono i soldi.
2. Scegliete le **regole** della partita:
   - **Proprietà del partner**: cosa succede quando ci arrivi. Di default ${ON_OWNED[DEFAULT_RULES.onOwned]}; in alternativa ${ON_OWNED.affitto}, oppure ${ON_OWNED.entrambi}.
   - **Stanze**: attive (di default) oppure disattivate, e in quel caso diventano caselle Attività.
   - **Soldi iniziali**: di default ${START_MONEY}€ a testa.
3. Confermate di avere entrambi più di 18 anni e iniziate.

Affitto e stanze si possono cambiare anche a partita in corso, in **Impostazioni**; i soldi iniziali valgono dalla partita successiva.

## Lo scopo

Girate sul tabellone, comprate proprietà e fate eseguire le sfide al partner. Chi deve pagare senza più soldi né vestiti va in **bancarotta**: l’altro vince, e chi perde esaudisce un suo desiderio.

## Il turno

- Lancia i dadi: la pedina avanza della somma.
- Ogni volta che passi dal **Via!** ritiri ${GO_BONUS}€.
- Esegui quello che dice la casella su cui arrivi, poi premi **Fatto · fine turno**.
- Con un **doppio** lanci di nuovo dopo aver finito il turno.

## Proprietà e sfide: chi esegue?

- **Proprietà libera**: puoi comprarla. Se la compri paghi tu e la sfida la esegue il partner; se non compri non succede nulla.
- **Proprietà del partner**: esegui tu la sfida, **al posto dell’affitto**. Con le regole “Solo affitto” paghi e basta; con “Affitto e sfida” fai tutte e due le cose.
- **Proprietà tua**: sei al sicuro (se volete potete ripeterla).
- **Tasse, bonus e carte**: esegue chi ci arriva.

I testi delle caselle sono scritti in seconda persona: “tu” è sempre chi esegue, “il partner” è l’altro giocatore. Le sfide a tempo hanno un timer (⏱): avvialo dal pulsante che compare sotto la carta.

## Affitti e stanze

- Ogni colore ha un affitto fisso, che si paga solo se l’affitto è attivo nelle regole.
- Con tutte le proprietà dello stesso colore l’affitto **raddoppia**, e raddoppia anche la durata della sfida.
- Le quattro **stanze** non hanno sfide: lì si paga sempre l’affitto, 25, 50, 100 o 200€ a seconda di quante ne possiede il proprietario.
- Chi possiede una stanza può spostarci l’azione di qualsiasi sfida.
- Se le stanze sono disattivate diventano caselle Attività e si pesca una carta.

${rentTable}

## Carte Attività

Sulle caselle Attività peschi una carta. Ce ne sono di quattro tipi: **Colpo di scena** (movimento e regole), **Jolly** (da tenere in mano), **Soldi** e **Riscatto** (azioni, a volte riscattabili pagando). Quando il mazzo finisce si rimescola.

## Prigione

- Ci finisci arrivando su **Vai in Prigione!** o con una carta, senza passare dal Via. Il doppio non vale più.
- Al tuo turno puoi uscire subito pagando **${JAIL_FINE}€**, con un **bacio di ${JAIL_KISS} secondi** o con la carta **Esci di prigione**; altrimenti salti il turno.
- In prigione non puoi toccare né guardare il partner: se lo fai, penitenza scelta dal partner oppure paghi ${JAIL_FINE}€.
- Se ci arrivi solo di passaggio non succede nulla.

## Quando finiscono i soldi

Se devi pagare e non hai abbastanza soldi, il saldo va a zero e per ogni **${DEBT_STEP}€** mancanti (arrotondati per eccesso) ti togli un indumento. Se gli indumenti non bastano, è bancarotta.

## Regole speciali

- **Orgasmo**: chi raggiunge l’orgasmo paga ${ORGASM_FINE}€ al partner.
- **Il Premio Finale** (casella 40) è l’unica in cui è permessa la penetrazione. Se cedete altrove pagate entrambi ${CEDE_FINE}€ e perdete la proprietà più costosa.
- **Scudo**: annulla una penitenza, oppure ti fa restituire l’affitto appena pagato.

Nell’app questi eventi si segnano dal pannello **Regole manuali** sul tavolo, insieme agli indumenti tolti o rimessi durante le sfide.

## Usare l’app

- Passa sopra una casella (o toccala) per vederne testo, affitto e proprietario.
- Le sfide a tempo hanno il pulsante del timer; un timer libero è in **Impostazioni**.
- In Impostazioni trovi anche le regole, lo zoom sul lato del giocatore di turno e il volume degli effetti.
- Durante la partita la barra in alto si apre con la linguetta **Mostra**.
- La partita resta salvata sul dispositivo: puoi aprire Caselle, Carte e Guida e tornare al Gioco senza perderla.
- Sul telefono puoi aggiungere Strip Street alla schermata Home e usarla come un’app.

## Le caselle

Le ${BOARD.length} caselle nell’ordine in cui le percorre la pedina, partendo dal Via. ⏱ indica le sfide a tempo.

${sides}

## Le carte Attività

Il mazzo ha ${CARDS.length} carte.

${cards}
`;

mkdirSync('doc', { recursive: true });
writeFileSync('doc/guida.md', md);
console.log(`ok  ${resolve('doc/guida.md')}`);

// --- Markdown -> HTML (solo quello che usa questa guida: titoli, paragrafi, elenchi, tabelle, grassetto) ---

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (t) => esc(t).replace(/\\\|/g, '|').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const splitRow = (l) => l.slice(1, -1).split(/(?<!\\)\|/).map((c) => c.trim());

function toHtml(src) {
  const lines = src.split('\n');
  const out = [];
  for (let i = 0; i < lines.length;) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    const h = l.match(/^(#{1,3}) (.*)/);
    if (h) { out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue; }
    if (l.startsWith('|')) {
      const rows = [];
      while (lines[i]?.startsWith('|')) rows.push(lines[i++]);
      const align = splitRow(rows[1]).map((c) => (c.endsWith(':') ? ' class="num"' : ''));
      const tr = (r, tag) => `<tr>${splitRow(r).map((c, k) => `<${tag}${align[k]}>${inline(c)}</${tag}>`).join('')}</tr>`;
      out.push(`<table><thead>${tr(rows[0], 'th')}</thead><tbody>${rows.slice(2).map((r) => tr(r, 'td')).join('')}</tbody></table>`);
      continue;
    }
    if (/^(\d+\.|-) /.test(l)) {
      const tag = /^\d/.test(l) ? 'ol' : 'ul';
      const items = [];
      while (lines[i] && /^(\s*)(\d+\.|-) /.test(lines[i])) {
        const sub = lines[i].startsWith(' ');
        const text = inline(lines[i].replace(/^\s*(\d+\.|-) /, ''));
        if (sub) items[items.length - 1].sub.push(text); else items.push({ text, sub: [] });
        i++;
      }
      out.push(`<${tag}>${items.map((it) => `<li>${it.text}${it.sub.length ? `<ul>${it.sub.map((s) => `<li>${s}</li>`).join('')}</ul>` : ''}</li>`).join('')}</${tag}>`);
      continue;
    }
    const para = [];
    while (lines[i]?.trim() && !/^(#|\||- |\d+\. )/.test(lines[i])) para.push(lines[i++]);
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return out.join('\n');
}

const logo = readFileSync('brand/export/logotipo.svg', 'utf8');
const body = toHtml(md.replace(/^# .*\n/, '')); // il titolo diventa la copertina col logotipo
const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Strip Street · Guida al gioco</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Lilita+One&display=swap" rel="stylesheet">
<style>
@page { size: A4; margin: 16mm 15mm 18mm; }
:root { --ink: #1A0F17; --velvet: #4A1530; --rose: #C8285A; --paper: #FFF8EC; --line: #E4D6C8; --muted: #6B5A63; }
* { box-sizing: border-box; }
body { margin: 0; font: 10.5pt/1.5 'Inter', system-ui, sans-serif; color: var(--ink); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.cover { background: var(--velvet); color: #fff; border-radius: 14px; padding: 22px 26px 20px; margin-bottom: 18px; }
.cover svg { display: block; width: 62%; height: auto; margin-bottom: 10px; }
.cover p { margin: 0; font-size: 11pt; opacity: .9; }
.cover h1 { margin: 0 0 4px; font: 400 20pt 'Lilita One', sans-serif; letter-spacing: .04em; text-transform: uppercase; color: #FFE9B0; }
h2 { font: 400 15pt 'Lilita One', sans-serif; letter-spacing: .04em; text-transform: uppercase; color: var(--rose); margin: 20px 0 6px; padding-bottom: 3px; border-bottom: 2px solid var(--ink); break-after: avoid; }
h3 { font: 700 11pt 'Inter', sans-serif; margin: 14px 0 6px; break-after: avoid; }
p { margin: 0 0 8px; }
ul, ol { margin: 0 0 8px; padding-left: 1.3em; }
li { margin-bottom: 3px; }
b { font-weight: 700; }
table { width: 100%; border-collapse: collapse; margin: 6px 0 12px; font-size: 9pt; line-height: 1.4; }
thead { display: table-header-group; }
tr { break-inside: avoid; }
th { text-align: left; background: var(--paper); border-bottom: 2px solid var(--ink); padding: 5px 6px; font-weight: 700; }
td { border-bottom: 1px solid var(--line); padding: 5px 6px; vertical-align: top; }
.num { text-align: right; white-space: nowrap; }
h2:nth-of-type(n+12) { break-before: page; }
</style></head><body>
<header class="cover">${logo}<h1>Guida al gioco</h1></header>
${body}
</body></html>`;

// --- PDF ---

const browser = [process.env.BROWSER,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
if (!browser) throw new Error('Chrome o Edge non trovato: impostare BROWSER');
const tmp = mkdtempSync(join(tmpdir(), 'guida-'));
const page = join(tmp, 'guida.html');
writeFileSync(page, html);
const pdf = resolve('doc/guida.pdf');
execFileSync(browser, ['--headless', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=8000',
  `--user-data-dir=${join(tmp, 'profile')}`, `--print-to-pdf=${pdf}`, pathToFileURL(page).href], { stdio: 'ignore' });
console.log(existsSync(pdf) ? `ok  ${pdf}` : 'ERRORE: PDF non creato');
