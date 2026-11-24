"""Genera i file del marchio Strip Street (SVG con le scritte convertite in tracciati).

Uso:  python brand/build.py
Scrive brand/export/*.svg, public/favicon.svg e public/icona-app.svg. Font: Lilita One (OFL) in brand/fonts/.
Stile "gioco da tavolo" come l'app: colori pieni, contorno d'inchiostro, ombra piena spostata, niente neon.
Il manuale brand/brand-board.html mostra questi file: si cambia il logo solo qui.
"""
import re
from pathlib import Path
from string import Template
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'export'
PUBLIC = ROOT.parent / 'public'

# Colori: gli stessi di src/style.css
C = dict(ink='#1A0F17', paper='#FFF8EC', rose='#E0446E', deep='#C8285A', gold='#F5C842', velvet='#4A1530')

# --- testo in tracciati -------------------------------------------------
FONT = TTFont(ROOT / 'fonts' / 'LilitaOne-Regular.ttf')
GS, CMAP, HMTX = FONT.getGlyphSet(), FONT.getBestCmap(), FONT['hmtx']
UPM = FONT['head'].unitsPerEm

def width(text, size, ls=0):
    return sum(HMTX[CMAP[ord(c)]][0] for c in text) * size / UPM + ls * (len(text) - 1)

def outline(attrs, text):
    """<text> -> <path>: stessi x, y, text-anchor, font-size, letter-spacing; ignora la crenatura."""
    size = float(attrs['font-size'])
    k = size / UPM
    ls = float(attrs.get('letter-spacing', 0))
    x = float(attrs.get('x', 0)) - {'middle': width(text, size, ls) / 2, 'end': width(text, size, ls)}.get(attrs.get('text-anchor'), 0)
    y = float(attrs.get('y', 0))
    d = []
    for ch in text:
        n = CMAP[ord(ch)]
        pen = SVGPathPen(GS, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
        GS[n].draw(TransformPen(pen, (k, 0, 0, -k, x, y)))
        d.append(pen.getCommands())
        x += HMTX[n][0] * k + ls
    keep = ' '.join(f'{a}="{v}"' for a, v in attrs.items() if a not in ('x', 'y', 'text-anchor', 'font-size', 'letter-spacing'))
    return f'<path {keep} d="{" ".join(d)}"/>'

ATTR = re.compile(r'([\w:-]+)="([^"]*)"')
def outline_all(svg):
    return re.sub(r'<text ([^>]*)>([^<]*)</text>', lambda m: outline(dict(ATTR.findall(m[1])), m[2]), svg)

def sticker(x, y, size, text, fill, stroke, sw, ls=0, shadow=0, anchor='middle'):
    """Scritta "adesivo": ombra piena d'inchiostro spostata + riempimento con contorno d'inchiostro sotto."""
    common = f'text-anchor="{anchor}" font-size="{size}" letter-spacing="{ls}" stroke-width="{sw}" stroke-linejoin="round" paint-order="stroke"'
    sh = f'<text x="{x + shadow}" y="{y + shadow}" {common} fill="{stroke}" stroke="{stroke}">{text}</text>' if shadow else ''
    return sh + f'<text x="{x}" y="{y}" {common} fill="{fill}" stroke="{stroke}">{text}</text>'

# --- forme ---------------------------------------------------------------
OUTER = 'M18 150 L120 48 Q210 34 300 48 L402 150 L300 252 Q210 266 120 252 Z'
INNER = 'M46 150 L130 66 Q210 54 290 66 L374 150 L290 234 Q210 246 130 234 Z'
STAR4 = 'M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6Z'
STAR8 = 'M0 -26 L4 -8 L16 -16 L8 -4 L26 0 L8 4 L16 16 L4 8 L0 26 L-4 8 L-16 16 L-8 4 L-26 0 L-8 -4 L-16 -16 L-4 -8Z'
MINI = 'M0 -8 L1.5 -2.5 L6 -5 L2.5 -1 L8 0 L2.5 1 L6 5 L1.5 2.5 L0 8 L-1.5 2.5 L-6 5 L-2.5 1 L-8 0 L-2.5 -1 L-6 -5 L-1.5 -2.5Z'
DIE = ('<rect x="-17" y="-17" width="40" height="40" rx="9" fill="$ink"/>'
       '<rect x="-20" y="-20" width="40" height="40" rx="9" fill="$paper" stroke="$ink" stroke-width="3"/>'
       '<g fill="$ink"><circle cx="-9" cy="-9" r="3.6"/><circle cx="9" cy="-9" r="3.6"/><circle cx="0" cy="0" r="3.6"/>'
       '<circle cx="-9" cy="9" r="3.6"/><circle cx="9" cy="9" r="3.6"/></g>')

BULBS = [(32.0, 150.0), (45.3, 136.7), (58.5, 123.5), (72.0, 110.0), (85.2, 96.8), (98.5, 83.5), (112.0, 70.0), (125.4, 56.9),
         (144.1, 54.4), (162.8, 52.5), (181.5, 51.2), (200.2, 50.6), (219.3, 50.6), (238.1, 51.2), (256.8, 52.5), (275.4, 54.4),
         (294.2, 56.9), (307.8, 69.8), (321.3, 83.3), (334.5, 96.5), (347.8, 109.8), (361.3, 123.3), (374.5, 136.5), (387.8, 149.8),
         (374.7, 163.3), (361.5, 176.5), (348.0, 190.0), (334.8, 203.2), (321.5, 216.5), (308.0, 230.0), (294.6, 243.1), (275.9, 245.6),
         (257.2, 247.5), (238.5, 248.8), (219.8, 249.4), (200.7, 249.4), (181.9, 248.8), (163.2, 247.5), (144.6, 245.6), (125.9, 243.1),
         (112.2, 230.2), (98.7, 216.7), (85.5, 203.5), (72.2, 190.2), (58.7, 176.7), (45.5, 163.5)]
BULB_SVG = ''.join(f'<circle cx="{x}" cy="{y}" r="4" style="--i:{i}"/>' for i, (x, y) in enumerate(BULBS))

# 1. Insegna completa: rombo-insegna sul palo, cornice di lampadine, dadi, stella. Classi usate dalle animazioni dell'app.
sw = width('street', 36) / 2
SIGN = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -14 420 314" role="img" aria-label="Strip Street">'
  '<g fill="$gold" stroke="$ink" stroke-width="3"><rect x="176" y="240" width="12" height="58"/><rect x="232" y="240" width="12" height="58"/></g>'
  '<g class="sign">'
  f'<path d="{OUTER}" transform="translate(8 8)" fill="$ink"/>'
  f'<path d="{OUTER}" fill="$gold" stroke="$ink" stroke-width="5" stroke-linejoin="round"/>'
  f'<path d="{INNER}" fill="$deep" stroke="$ink" stroke-width="4" stroke-linejoin="round"/>'
  '<g class="bulbs" fill="$paper" stroke="$ink" stroke-width="1.6">' + BULB_SVG + '</g>'
  f'<g fill="$gold" stroke="$ink" stroke-width="1.2"><path transform="translate(124 100)" d="{STAR4}"/><path transform="translate(296 100)" d="{STAR4}"/></g>'
  '<text x="210" y="104" text-anchor="middle" font-size="14" letter-spacing="2.5" fill="$gold">CASELLA N° 40</text>'
  '<g class="dice"><g transform="translate(92 150) rotate(-14)"><use href="#$p-die"/></g><g transform="translate(328 150) rotate(16)"><use href="#$p-die"/></g></g>'
  '<g class="n-strip">' + sticker(210, 172, 62, 'STRIP', '$paper', '$ink', 7, ls=2, shadow=4) + '</g>'
  '<g class="n-street">' + sticker(210, 214, 36, 'street', '$gold', '$ink', 6, shadow=3) + '</g>'
  f'<g fill="$paper" stroke="$ink" stroke-width="1.6"><path transform="translate({210 - sw - 18:.1f} 201)" d="{STAR4}"/><path transform="translate({210 + sw + 18:.1f} 201)" d="{STAR4}"/></g>'
  '</g>'
  f'<g class="star"><path transform="translate(214 34)" d="{STAR8}" fill="$ink"/><path transform="translate(210 30)" d="{STAR8}" fill="$gold" stroke="$ink" stroke-width="3" stroke-linejoin="round"/></g>'
  '<defs><g id="$p-die">' + DIE + '</g></defs></svg>')

# 2. Semplificata: solo rombo e scritta. $shadow = "" toglie le ombre (versioni monocromo).
SIMPLE = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="8 28 410 250" role="img" aria-label="Strip Street">'
  f'<path d="{OUTER}" transform="translate(8 8)" fill="$shade"/>'
  f'<path d="{OUTER}" fill="$bg" stroke="$ink" stroke-width="6" stroke-linejoin="round"/>'
  + sticker(210, 174, 80, 'STRIP', '$fg', '$ink', '$sw', ls=2, shadow=5).replace('fill="$ink" stroke="$ink"', 'fill="$shade" stroke="$shade"', 1)
  + sticker(210, 222, 42, 'street', '$accent', '$ink', '$sw') + '</svg>')

# 3. Logotipo orizzontale: stella + scritta su una riga. Contorno d'inchiostro = leggibile su carta e su velluto.
wx = 56 + width('STRIP', 54, 2) + 12
WORD = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {wx + width("street", 42) + 10:.0f} 80" role="img" aria-label="Strip Street">'
  f'<path transform="translate(26 42) scale(.82)" d="{STAR8}" fill="$ink"/><path transform="translate(23 39) scale(.82)" d="{STAR8}" fill="$gold" stroke="$ink" stroke-width="3.5" stroke-linejoin="round"/>'
  + sticker(56, 62, 54, 'STRIP', '$paper', '$ink', 7, ls=2, shadow=4, anchor='start')
  + sticker(round(wx, 1), 62, 42, 'street', '$rose', '$ink', 6, shadow=3, anchor='start') + '</svg>')

# 4. Simbolo: favicon e icona app. Rombo rosa con la S e la stella sulla cornice.
MARK = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="$vb" role="img" aria-label="Strip Street">$plate'
  '<path d="M4 35 L18 19 Q32 16 46 19 L60 35 L46 51 Q32 54 18 51 Z" transform="translate(2.5 2.5)" fill="$ink"/>'
  '<path d="M4 35 L18 19 Q32 16 46 19 L60 35 L46 51 Q32 54 18 51 Z" fill="$rose" stroke="$ink" stroke-width="3" stroke-linejoin="round"/>'
  + sticker(32, 47, 30, 'S', '$paper', '$ink', 4.5) +
  f'<path transform="translate(32 15)" d="{MINI}" fill="$gold" stroke="$ink" stroke-width="1.8" stroke-linejoin="round"/></svg>')

MONO = lambda c: dict(bg='none', shade='none', fg=c, accent=c, ink=c, sw='0')
FILES = {
    'insegna.svg': (SIGN, {}),
    'semplificato.svg': (SIMPLE, dict(bg=C['deep'], shade=C['ink'], fg=C['paper'], accent=C['gold'], sw='7')),
    'semplificato-mono-scuro.svg': (SIMPLE, MONO(C['ink'])),
    'semplificato-mono-chiaro.svg': (SIMPLE, MONO(C['paper'])),
    'logotipo.svg': (WORD, {}),
    'simbolo.svg': (MARK, dict(vb='0 0 66 66', plate='')),
    'icona-app.svg': (MARK, dict(vb='-12 -12 90 90', plate=f'<rect x="-12" y="-12" width="90" height="90" rx="20" fill="{C["gold"]}"/>')),
}

def render(tpl, vals, prefix):
    return outline_all(Template(tpl).safe_substitute({**C, **vals, 'p': prefix}))

if __name__ == '__main__':
    OUT.mkdir(exist_ok=True)
    for old in OUT.glob('*.svg'):
        old.unlink()
    for name, (tpl, vals) in FILES.items():
        (OUT / name).write_text(render(tpl, vals, 'ss-' + name.split('.')[0]), encoding='utf-8')
        print('scritto', OUT.name + '/' + name)
    (PUBLIC / 'favicon.svg').write_text((OUT / 'simbolo.svg').read_text(encoding='utf-8'), encoding='utf-8')
    (PUBLIC / 'icona-app.svg').write_text((OUT / 'icona-app.svg').read_text(encoding='utf-8'), encoding='utf-8')
    print('scritto public/favicon.svg, public/icona-app.svg')
