// Genera i PDF stampabili in doc/ da print.html, con Edge (o Chrome) in modalità headless.
// Serve il server di sviluppo acceso: `npm run dev`, poi `npm run pdf` (URL diverso: `npm run pdf -- http://localhost:5199`).
// ponytail: percorsi dei browser fissi per Windows; su altri sistemi passare il browser in BROWSER=/percorso.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const base = process.argv[2] || 'http://localhost:5173';
const browser = [process.env.BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
if (!browser) throw new Error('Edge o Chrome non trovato: impostare BROWSER');

mkdirSync('doc', { recursive: true });
for (const [sheet, file] of [['tabellone', 'tabellone-A3'], ['attivita', 'carte-attivita-A4'], ['proprieta', 'carte-proprieta-A4']]) {
  const out = resolve('doc', `${file}.pdf`);
  execFileSync(browser, ['--headless', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=8000',
    `--print-to-pdf=${out}`, `${base}/print.html?sheet=${sheet}`], { stdio: 'ignore' });
  console.log(existsSync(out) ? `ok  ${out}` : `ERRORE ${sheet}`);
}
