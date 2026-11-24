// Illustrazioni disegnate a mano (SVG): angoli, caselle, tipi di carta e dorsi dei mazzi.
// Stile gioco da tavolo: colori pieni, contorno d'inchiostro, niente sfumature.
const INK = '#1A0F17';
const g = (body, vb = '0 0 100 100') =>
  `<svg class="art-svg" viewBox="${vb}" aria-hidden="true"><g stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
const star = (x, y, r, fill = '#FFE9B0') =>
  `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="${fill}" stroke-width="2"/>`;
const coin = (y) => `<path d="M48 ${y}v7a16 5.5 0 0 0 32 0v-7" fill="#C98A12"/><ellipse cx="64" cy="${y}" rx="16" ry="5.5" fill="#F5C842"/>`;
const heart = 'M50 66C36 56 30 48 30 41a10 10 0 0 1 20-4a10 10 0 0 1 20 4C70 48 64 56 50 66Z';
const heartAt = (cx, cy, s, fill) =>
  `<path d="${heart}" transform="translate(${cx} ${cy}) scale(${s}) translate(-50 -51)" fill="${fill}" stroke-width="${(3 / s).toFixed(1)}"/>`;
const drop = (x, y, s = 1, fill = '#29A3DC') =>
  `<path d="M${x} ${y - 7 * s}Q${x + 6 * s} ${y + 2 * s} ${x} ${y + 5 * s}Q${x - 6 * s} ${y + 2 * s} ${x} ${y - 7 * s}Z" fill="${fill}" stroke-width="2"/>`;
// tubo/anello a due colori: contorno d'inchiostro spesso, colore sopra
const tube = (d, color, w = 6) => `<path d="${d}" fill="none" stroke-width="${w + 6}"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${w}"/>`;
const C = { red: '#ED1B24', rose: '#E0446E', pink: '#F7B5C8', gold: '#F5C842', orange: '#F7941D', blue: '#29A3DC', sky: '#AAE0FA',
  green: '#1FB25A', velvet: '#4A1530', brown: '#955436', paper: '#FFF8EC', white: '#FFFFFF', lilac: '#B48EE0', skin: '#F2C4A0', steel: '#C9CDD6' };
const HAND = `<rect x="26" y="22" width="11" height="36" rx="5.5" fill="${C.skin}"/><rect x="38" y="14" width="11" height="40" rx="5.5" fill="${C.skin}"/>`
  + `<rect x="50" y="16" width="11" height="40" rx="5.5" fill="${C.skin}"/><rect x="62" y="24" width="11" height="34" rx="5.5" fill="${C.skin}"/>`
  + `<rect x="12" y="50" width="12" height="28" rx="6" transform="rotate(-35 18 64)" fill="${C.skin}"/><rect x="26" y="44" width="47" height="42" rx="14" fill="${C.skin}"/>`;
const INF = 'M50 50C38 30 12 30 12 50S38 70 50 50S88 30 88 50S62 70 50 50Z';

// Caselle e carte: una illustrazione per icona (nome Lucide usato in data.js), così si aggiunge una casella
// disegnata senza toccare il resto. Le icone senza disegno ricadono sull'icona ad adesivo.
const CELLS = {
  Sparkles: star(46, 54, 34, C.gold) + star(80, 22, 13, C.rose) + star(22, 22, 9, C.sky) + star(82, 82, 7, C.white),
  Eye: `<path d="M8 50Q50 10 92 50Q50 90 8 50Z" fill="${C.white}"/><circle cx="50" cy="50" r="18" fill="${C.blue}"/><circle cx="50" cy="50" r="8" fill="${INK}"/>`
    + `<circle cx="56" cy="44" r="4" fill="${C.white}" stroke="none"/><path d="M30 26l-4-9M50 20v-10M70 26l4-9"/>`,
  MessageCircleQuestion: `<path d="M50 14C74 14 90 28 90 46S74 78 50 78C44 78 38 77 33 75L14 86L20 68C13 62 10 54 10 46C10 28 26 14 50 14Z" fill="${C.sky}"/>`
    + tube('M41 37a10 10 0 1 1 14 9c-3 1.5-5 3-5 7v2', C.white, 5) + `<circle cx="50" cy="65" r="4.5" fill="${C.white}"/>`,
  MessageCircleHeart: `<path d="M50 14C74 14 90 28 90 46S74 78 50 78C44 78 38 77 33 75L14 86L20 68C13 62 10 54 10 46C10 28 26 14 50 14Z" fill="${C.white}"/>`
    + heartAt(50, 47, 0.95, C.rose),
  Heart: heartAt(50, 52, 2, C.rose) + `<path d="M28 34a12 12 0 0 1 12-8" fill="none" stroke="${C.pink}" stroke-width="5"/>` + heartAt(84, 18, 0.4, C.pink) + heartAt(16, 82, 0.35, C.red),
  Sofa: `<rect x="18" y="28" width="64" height="32" rx="8" fill="${C.lilac}"/><rect x="22" y="54" width="56" height="18" rx="4" fill="#9B6FD0"/>`
    + `<rect x="8" y="44" width="18" height="30" rx="7" fill="${C.lilac}"/><rect x="74" y="44" width="18" height="30" rx="7" fill="${C.lilac}"/>`
    + `<path d="M18 74v8M82 74v8"/>` + heartAt(50, 42, 0.5, C.rose),
  Cookie: `<path d="M80 30A36 36 0 1 1 62 16Q62 28 71 25Q72 32 80 30Z" fill="#D9A05B"/>`
    + `<g fill="#5A3215" stroke-width="2"><circle cx="36" cy="40" r="5"/><circle cx="56" cy="56" r="5"/><circle cx="34" cy="66" r="4"/><circle cx="66" cy="74" r="4"/><circle cx="54" cy="34" r="3.5"/></g>`
    + `<g fill="#D9A05B" stroke-width="2"><circle cx="84" cy="16" r="3"/><circle cx="90" cy="26" r="2.5"/></g>`,
  Speech: `<path d="M10 56Q20 40 30 46Q35 42 40 46Q45 42 50 46Q60 40 70 56Q40 60 10 56Z" fill="${C.red}"/><path d="M10 56Q40 60 70 56Q56 78 40 76Q24 78 10 56Z" fill="#C8102E"/>`
    + `<path d="M26 64q6 3 12 1" stroke="#FF8A8A" stroke-width="3" fill="none"/><path d="M76 34a12 12 0 0 1 6 14M82 22a24 24 0 0 1 10 26" fill="none"/>`,
  WandSparkles: `<g transform="rotate(45 50 50)"><rect x="44" y="36" width="12" height="58" rx="4" fill="${INK}"/><rect x="44" y="36" width="12" height="14" rx="4" fill="${C.white}"/></g>`
    + star(72, 26, 17, C.gold) + star(34, 22, 8, C.rose) + star(86, 60, 7, C.sky),
  Hand: HAND + heartAt(50, 66, 0.45, C.rose) + star(84, 22, 8, C.pink),
  Zap: `<circle cx="50" cy="50" r="42" fill="${C.orange}"/><path d="M58 10L24 56H46L38 90L78 40H54Z" fill="${C.gold}"/>`,
  EyeOff: `<path d="M10 44H3M90 44h7" stroke-width="5"/><path d="M10 44Q10 30 30 30Q42 30 50 38Q58 30 70 30Q90 30 90 44Q90 64 70 64Q58 64 50 54Q42 64 30 64Q10 64 10 44Z" fill="${C.velvet}"/>`
    + `<path d="M24 46q6 6 12 0M64 46q6 6 12 0" stroke="${C.pink}" stroke-width="3" fill="none"/>` + star(80, 82, 8, C.gold) + star(22, 84, 6, C.gold),
  Target: `<circle cx="50" cy="52" r="40" fill="${C.red}"/><circle cx="50" cy="52" r="29" fill="${C.white}"/><circle cx="50" cy="52" r="18" fill="${C.red}"/><circle cx="50" cy="52" r="7" fill="${C.white}"/>`
    + `<path d="M50 52L84 18" stroke-width="5"/><path d="M84 18l-1-12 7 5 5 7 -12-1Z" fill="${C.gold}"/>`,
  ChefHat: `<circle cx="32" cy="42" r="16" fill="${C.white}"/><circle cx="68" cy="42" r="16" fill="${C.white}"/><circle cx="50" cy="30" r="19" fill="${C.white}"/>`
    + `<rect x="30" y="48" width="40" height="34" rx="3" fill="${C.white}"/><path d="M30 72H70"/>` + heartAt(50, 61, 0.35, C.rose),
  Hourglass: `<path d="M30 20H70Q70 42 54 50Q70 58 70 80H30Q30 58 46 50Q30 42 30 20Z" fill="${C.sky}"/>`
    + `<path d="M36 30H64Q62 40 50 46Q38 40 36 30Z" fill="${C.gold}" stroke-width="2"/><path d="M34 78Q40 64 50 62Q60 64 66 78Z" fill="${C.gold}" stroke-width="2"/><path d="M50 48V62" stroke-width="2"/>`
    + `<rect x="22" y="10" width="56" height="10" rx="3" fill="${C.brown}"/><rect x="22" y="80" width="56" height="10" rx="3" fill="${C.brown}"/>`,
  Ban: `<circle cx="50" cy="50" r="40" fill="${C.white}"/><g transform="translate(25 22) scale(.5)">${HAND}</g>`
    + `<circle cx="50" cy="50" r="34" fill="none" stroke="${C.red}" stroke-width="10"/><path d="M26 26L74 74" stroke="${C.red}" stroke-width="10"/><circle cx="50" cy="50" r="40" fill="none"/>`,
  Shirt: `<path d="M34 14L12 26L20 46L30 41V88H70V41L80 46L88 26L66 14Q58 24 50 24Q42 24 34 14Z" fill="${C.rose}"/>`
    + `<path d="M30 41V30M70 41V30" stroke-width="2"/>` + heartAt(50, 56, 0.5, C.white),
  Glasses: `<path d="M44 46Q50 38 56 46" fill="none"/><path d="M16 42L8 32M84 42L92 32"/>` + heartAt(30, 50, 0.75, C.red) + heartAt(70, 50, 0.75, C.red)
    + `<path d="M20 44l6-5M60 44l6-5" stroke="${C.white}" stroke-width="3"/>`,
  Feather: `<path d="M82 10Q30 18 22 72L18 88L30 76Q80 66 82 10Z" fill="${C.pink}"/><path d="M82 10L16 90"/>`
    + `<path d="M70 40L54 28M58 55L42 43M45 69L31 59" stroke-width="2"/>`,
  Ear: `<path d="M40 88Q28 88 28 75Q28 65 36 58Q28 50 28 38Q28 12 54 12Q80 12 80 38Q80 54 66 62Q58 68 58 76Q58 88 40 88Z" fill="${C.skin}"/>`
    + `<path d="M44 42Q44 26 56 26Q68 26 68 40Q68 48 60 52Q52 56 52 64" fill="none"/>` + heartAt(84, 76, 0.35, C.rose) + star(16, 20, 7, C.gold),
  ShowerHead: tube('M20 94V30Q20 14 36 14H66V24', C.steel, 5) + `<path d="M48 24H84L78 34H54Z" fill="${C.steel}"/>`
    + drop(56, 48) + drop(68, 46) + drop(80, 50) + drop(60, 64) + drop(74, 62) + drop(66, 80),
  Link: tube('M32 58m-18 0a18 18 0 1 0 36 0a18 18 0 1 0 -36 0', C.rose, 7) + tube('M68 58m-18 0a18 18 0 1 0 36 0a18 18 0 1 0 -36 0', C.rose, 7)
    + `<g fill="${C.steel}"><circle cx="42" cy="34" r="5"/><circle cx="50" cy="28" r="5"/><circle cx="58" cy="34" r="5"/></g>`,
  Crown: `<path d="M14 74L18 30L36 50L50 20L64 50L82 30L86 74Z" fill="${C.gold}"/><rect x="14" y="74" width="72" height="12" rx="2" fill="#E0A800"/>`
    + `<circle cx="32" cy="80" r="4" fill="${C.red}"/><circle cx="50" cy="80" r="4" fill="${C.blue}"/><circle cx="68" cy="80" r="4" fill="${C.green}"/>`
    + `<g fill="${C.red}"><circle cx="18" cy="28" r="5"/><circle cx="50" cy="18" r="5"/><circle cx="82" cy="28" r="5"/></g>`,
  Music: `<path d="M38 72V28M78 64V20" stroke-width="5"/><path d="M36 24L80 14V26L36 36Z" fill="${INK}"/>`
    + `<ellipse cx="28" cy="74" rx="12" ry="9" transform="rotate(-20 28 74)" fill="${C.blue}"/><ellipse cx="68" cy="66" rx="12" ry="9" transform="rotate(-20 68 66)" fill="${C.rose}"/>`
    + star(14, 30, 6, C.gold),
  Ribbon: `<path d="M46 50L32 88L42 82L48 90L52 52Z" fill="#C8102E"/><path d="M54 50L68 88L58 82L52 90L48 52Z" fill="#C8102E"/>`
    + `<path d="M50 46Q26 18 14 34Q8 50 28 54Q40 56 50 46Z" fill="${C.red}"/><path d="M50 46Q74 18 86 34Q92 50 72 54Q60 56 50 46Z" fill="${C.red}"/>`
    + `<circle cx="50" cy="48" r="9" fill="${C.red}"/>`,
  Droplet: `<rect x="42" y="22" width="16" height="20" fill="#F5B342"/><rect x="40" y="10" width="20" height="13" rx="3" fill="${C.green}"/>`
    + `<rect x="28" y="40" width="44" height="50" rx="10" fill="#F5B342"/><rect x="34" y="54" width="32" height="22" rx="3" fill="${C.paper}"/>`
    + heartAt(50, 65, 0.4, C.rose) + drop(84, 70, 1.8, '#F5B342'),
  Vibrate: `<rect x="34" y="12" width="32" height="76" rx="8" fill="${C.lilac}"/><rect x="39" y="20" width="22" height="52" rx="3" fill="${C.sky}"/>`
    + heartAt(50, 46, 0.4, C.rose) + `<circle cx="50" cy="80" r="3" fill="${C.white}"/><path d="M24 34l-6 8 6 8-6 8M76 34l6 8-6 8 6 8" fill="none"/>`,
  Moon: `<path d="M58 10A34 34 0 1 0 88 60A27 27 0 1 1 58 10Z" fill="${C.gold}"/>` + star(78, 22, 7, C.white) + star(88, 40, 4, C.white)
    + `<path d="M4 80Q26 68 50 80T96 80V96H4Z" fill="${C.blue}"/>`,
  BedDouble: `<rect x="12" y="20" width="76" height="40" rx="6" fill="${C.brown}"/><rect x="8" y="52" width="84" height="22" rx="4" fill="${C.white}"/>`
    + `<rect x="18" y="40" width="26" height="14" rx="6" fill="${C.white}"/><rect x="56" y="40" width="26" height="14" rx="6" fill="${C.white}"/>`
    + `<rect x="8" y="60" width="84" height="16" rx="4" fill="${C.rose}"/><path d="M14 76v10M86 76v10" stroke-width="5"/>` + heartAt(50, 30, 0.3, C.pink),
  Cherry: tube('M32 64Q38 32 62 16M70 58Q66 34 62 16', C.green, 3) + `<path d="M62 16Q78 4 90 14Q78 26 62 16Z" fill="${C.green}"/>`
    + `<circle cx="32" cy="70" r="17" fill="${C.red}"/><circle cx="70" cy="64" r="17" fill="${C.red}"/>`
    + `<path d="M24 64a8 8 0 0 1 6-5M62 58a8 8 0 0 1 6-5" stroke="${C.white}" stroke-width="3"/>`,
  Infinity: `<g transform="rotate(-8 50 50)"><rect x="22" y="8" width="56" height="84" rx="6" fill="${C.white}"/>`
    + `<g transform="translate(50 50) scale(.5) translate(-50 -50)">${tube(INF, C.rose, 10)}</g></g>` + star(84, 18, 7, C.gold),
  Flame: `<path d="M50 92C26 92 16 74 18 58C20 42 34 36 34 20C46 28 52 38 52 48C58 42 60 34 58 26C76 38 84 54 82 66C80 82 68 92 50 92Z" fill="${C.red}"/>`
    + `<path d="M50 88C40 88 34 80 36 70C38 60 46 58 48 48C58 56 64 64 64 72C64 82 58 88 50 88Z" fill="${C.orange}"/>`
    + `<path d="M50 86C45 86 42 82 43 77C44 72 48 70 50 66C55 70 57 74 57 78C57 83 54 86 50 86Z" fill="${C.gold}" stroke-width="2"/>`,
  // tipi di carta Attività
  Shuffle: tube('M10 30H32Q48 30 56 50Q64 70 78 70', C.orange) + `<path d="M76 58L94 70L76 82Z" fill="${C.orange}"/>`
    + tube('M10 70H32Q48 70 56 50Q64 30 78 30', C.blue) + `<path d="M76 18L94 30L76 42Z" fill="${C.blue}"/>`,
  Shield: `<path d="M50 8L86 20V48Q86 78 50 92Q14 78 14 48V20Z" fill="#3FB8AF"/><path d="M50 18L76 27V48Q76 70 50 82Z" fill="#7FD8D1" stroke="none"/>`
    + heartAt(50, 50, 0.6, C.rose),
  Coins: `<g transform="rotate(-12 40 38)"><rect x="8" y="20" width="62" height="34" rx="4" fill="${C.green}"/><circle cx="39" cy="37" r="9" fill="#8FE0AE"/>`
    + `<rect x="13" y="25" width="52" height="24" rx="2" fill="none" stroke-width="2"/></g>` + coin(84) + coin(76) + coin(68) + coin(60)
    + `<ellipse cx="64" cy="60" rx="9" ry="3" fill="none" stroke-width="2"/>`,
};

export const ART = {
  start: g(`${coin(80)}${coin(73)}${coin(66)}<ellipse cx="64" cy="66" rx="9" ry="3" fill="none" stroke-width="2"/>`
    + `<path d="M8 40L36 16V30H90V50H36V64Z" fill="#ED1B24"/><path d="M40 35H84" stroke="#FF9C94" stroke-width="3"/>`
    + star(22, 80, 8) + star(90, 70, 5)),

  jail: g(`<rect x="14" y="14" width="72" height="72" rx="6" fill="#F7941D"/><rect x="24" y="24" width="52" height="52" rx="3" fill="#4A1530"/>`
    + `<path d="${heart}" fill="#E0446E"/><g fill="#F6EEE9" stroke-width="2.5"><rect x="29" y="24" width="6" height="52"/><rect x="41" y="24" width="6" height="52"/>`
    + `<rect x="53" y="24" width="6" height="52"/><rect x="65" y="24" width="6" height="52"/><rect x="24" y="44" width="52" height="5"/></g>`
    + `<path d="M44 76v-6a6 6 0 0 1 12 0v6" fill="none"/><rect x="40" y="74" width="20" height="16" rx="3" fill="#F5C842"/><circle cx="50" cy="81" r="2" fill="${INK}"/>`),

  relax: g(`<circle cx="50" cy="50" r="40" fill="#AAE0FA"/><path d="M20 26H80L50 58Z" fill="#FFFFFF"/><path d="M29 35H71L50 58Z" fill="#E0446E"/>`
    + `<path d="M50 58V80"/><ellipse cx="50" cy="82" rx="14" ry="4" fill="#FFFFFF"/><path d="M64 14L44 46"/><circle cx="48" cy="39" r="5" fill="#1FB25A"/>`
    + star(80, 72, 6) + star(18, 62, 5)),

  gotojail: g(`<g stroke="#ED1B24" stroke-width="4"><path d="M50 6v12M18 18l8 8M82 18l-8 8M6 48h12M94 48H82"/></g>`
    + `<path d="M30 70V52a20 20 0 0 1 40 0V70Z" fill="#ED1B24"/><path d="M38 52a12 12 0 0 1 8-11" stroke="#FFB3B3" stroke-width="4" fill="none"/>`
    + `<rect x="22" y="70" width="56" height="12" rx="3" fill="#2A4BA8"/><rect x="14" y="82" width="72" height="9" rx="3" fill="${INK}"/>`),

  // dorsi dei mazzi (5:7)
  deckAct: g(`<rect x="1.5" y="1.5" width="97" height="137" rx="8" fill="#F7941D"/>`
    + `<rect x="7" y="7" width="86" height="126" rx="5" fill="none" stroke="#FFF6E5" stroke-width="2" stroke-dasharray="4 3"/>`
    + `<g transform="translate(-25 0) scale(1.5)"><g transform="translate(0 12)"><path d="${heart}" fill="#E0446E" stroke-width="2"/>`
    + `<path d="M44 44a6 6 0 1 1 9 5c-2 1.3-3 2.3-3 5v1.5" fill="none" stroke="#FFF6E5" stroke-width="4"/><circle cx="50" cy="60" r="2.2" fill="#FFF6E5" stroke="none"/></g></g>`
    + star(20, 116, 7) + star(82, 44, 6) + star(84, 120, 4), '0 0 100 140'),

  deckProp: g(`<rect x="1.5" y="1.5" width="97" height="137" rx="8" fill="#29A3DC"/>`
    + `<rect x="7" y="7" width="86" height="126" rx="5" fill="none" stroke="#FFF6E5" stroke-width="2" stroke-dasharray="4 3"/>`
    + `<g transform="translate(0 3)"><rect x="62" y="42" width="9" height="18" fill="#955436"/><path d="M18 68L50 38L82 68Z" fill="#ED1B24"/>`
    + `<rect x="26" y="66" width="48" height="40" fill="#FFF6E5"/><rect x="31" y="73" width="11" height="11" fill="#AAE0FA"/><rect x="58" y="73" width="11" height="11" fill="#AAE0FA"/>`
    + `<path d="M43 106V90a7 7 0 0 1 14 0V106Z" fill="#E0446E"/><path d="M14 106H86"/></g>`
    // chiave dentro la cornice tratteggiata (che finisce a y=133)
    + `<circle cx="32" cy="120" r="6" fill="#F5C842"/><path d="M38 120H68M62 120v5M68 120v5" stroke-width="3"/>`
    + star(85, 52, 6) + star(15, 56, 4), '0 0 100 140'), // stelle sotto l'etichetta del dorso

  ...Object.fromEntries(Object.entries(CELLS).map(([k, body]) => [k, g(body)])),
};
