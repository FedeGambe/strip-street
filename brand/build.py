"""Genera i file del marchio Strip Street (SVG con le scritte convertite in tracciati).

Uso:  python brand/build.py
Scrive brand/export/*.svg e public/favicon.svg. I font (OFL, da Google Fonts) stanno in brand/fonts/.
Le geometrie sono le stesse del manuale brand/brand-board.html: se cambi una, cambia anche l'altra.
"""
import re
from pathlib import Path
from string import Template
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'export'
PUBLIC = ROOT.parent / 'public'

# --- font ---------------------------------------------------------------
def load(name, **axes):
    f = TTFont(ROOT / 'fonts' / name)
    return instantiateVariableFont(f, axes) if axes else f

FONTS = {
    'Anton': load('Anton-Regular.ttf'),
    'Bodoni': load('BodoniModa-Italic.ttf', wght=700, opsz=28),
    'Outfit': load('Outfit.ttf', wght=600),
}

def outline(attrs, text):
    """<text> -> <path>: stessi x, y, text-anchor, font-size, letter-spacing; ignora la crenatura."""
    fam = next(k for k in FONTS if k in attrs['font-family'])
    font = FONTS[fam]
    gs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font['hmtx']
    size = float(attrs['font-size'])
    k = size / font['head'].unitsPerEm
    ls = float(attrs.get('letter-spacing', 0))
    names = [cmap[ord(c)] for c in text]
    width = sum(hmtx[n][0] * k + ls for n in names) - ls
    x = float(attrs.get('x', 0)) - {'middle': width / 2, 'end': width}.get(attrs.get('text-anchor'), 0)
    y = float(attrs.get('y', 0))
    d = []
    for n in names:
        pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
        gs[n].draw(TransformPen(pen, (k, 0, 0, -k, x, y)))
        d.append(pen.getCommands())
        x += hmtx[n][0] * k + ls
    keep = ' '.join(f'{a}="{v}"' for a, v in attrs.items()
                    if a not in ('x', 'y', 'text-anchor', 'font-family', 'font-size', 'letter-spacing', 'font-style', 'font-weight'))
    return f'<path {keep} d="{" ".join(d)}"/>'

ATTR = re.compile(r'([\w:-]+)="([^"]*)"')
def outline_all(svg):
    return re.sub(r'<text ([^>]*)>([^<]*)</text>', lambda m: outline(dict(ATTR.findall(m[1])), m[2]), svg)

# --- elementi comuni ----------------------------------------------------
DEFS = '''<linearGradient id="$p-velvet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5E1B3C"/><stop offset="1" stop-color="#33091F"/></linearGradient>
<linearGradient id="$p-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6E2AE"/><stop offset=".5" stop-color="#D8B26A"/><stop offset="1" stop-color="#F1D79A"/></linearGradient>
<filter id="$p-neon" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<path id="$p-star4" d="M0 -5 L1.3 -1.3 L5 0 L1.3 1.3 L0 5 L-1.3 1.3 L-5 0 L-1.3 -1.3Z"/>
<path id="$p-star8" d="M0 -26 L4 -8 L16 -16 L8 -4 L26 0 L8 4 L16 16 L4 8 L0 26 L-4 8 L-16 16 L-8 4 L-26 0 L-8 -4 L-16 -16 L-4 -8Z"/>
<g id="$p-die5"><rect x="-20" y="-20" width="40" height="40" rx="9" fill="#F6EEE9"/><g fill="#1A0F17"><circle cx="-9" cy="-9" r="3.6"/><circle cx="9" cy="-9" r="3.6"/><circle cx="0" cy="0" r="3.6"/><circle cx="-9" cy="9" r="3.6"/><circle cx="9" cy="9" r="3.6"/></g></g>'''

BULBS = [(32.0, 150.0), (45.3, 136.7), (58.5, 123.5), (72.0, 110.0), (85.2, 96.8), (98.5, 83.5), (112.0, 70.0), (125.4, 56.9),
         (144.1, 54.4), (162.8, 52.5), (181.5, 51.2), (200.2, 50.6), (219.3, 50.6), (238.1, 51.2), (256.8, 52.5), (275.4, 54.4),
         (294.2, 56.9), (307.8, 69.8), (321.3, 83.3), (334.5, 96.5), (347.8, 109.8), (361.3, 123.3), (374.5, 136.5), (387.8, 149.8),
         (374.7, 163.3), (361.5, 176.5), (348.0, 190.0), (334.8, 203.2), (321.5, 216.5), (308.0, 230.0), (294.6, 243.1), (275.9, 245.6),
         (257.2, 247.5), (238.5, 248.8), (219.8, 249.4), (200.7, 249.4), (181.9, 248.8), (163.2, 247.5), (144.6, 245.6), (125.9, 243.1),
         (112.2, 230.2), (98.7, 216.7), (85.5, 203.5), (72.2, 190.2), (58.7, 176.7), (45.5, 163.5)]
BULB_SVG = ''.join(f'<circle cx="{x}" cy="{y}" r="3.4" style="--i:{i}"/>' for i, (x, y) in enumerate(BULBS))

SIGN = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -14 420 314" role="img" aria-label="Strip Street"><defs>''' + DEFS + '''</defs>
<g fill="$gold"><rect x="176" y="250" width="10" height="50"/><rect x="234" y="250" width="10" height="50"/></g>
<g class="sign">
<path d="M18 150 L120 48 Q210 34 300 48 L402 150 L300 252 Q210 266 120 252 Z" fill="$bg" stroke="$gold" stroke-width="3"/>
<path d="M46 150 L130 66 Q210 54 290 66 L374 150 L290 234 Q210 246 130 234 Z" fill="none" stroke="$gold" stroke-width="1.2"/>
<g class="bulbs" fill="$bulb">''' + BULB_SVG + '''</g>
<g fill="$gold"><use href="#$p-star4" x="122" y="96"/><use href="#$p-star4" x="298" y="96"/></g>
<text x="210" y="100" text-anchor="middle" font-family="Outfit" font-size="11" letter-spacing="3.5" fill="$gold">CASELLA N° 40</text>
<g class="dice" opacity="$dice"><g transform="translate(94 150) rotate(-14)"><use href="#$p-die5"/></g><g transform="translate(326 150) rotate(16)"><use href="#$p-die5"/></g></g>
<g class="n-strip"><text x="210" y="168" text-anchor="middle" font-family="Anton" font-size="66" letter-spacing="5" fill="$glow" filter="$filter">STRIP</text><text x="210" y="168" text-anchor="middle" font-family="Anton" font-size="66" letter-spacing="5" fill="$white">STRIP</text></g>
<g class="n-street"><text x="210" y="206" text-anchor="middle" font-family="Bodoni" font-size="32" fill="$neon" filter="$filter">street</text><text x="210" y="206" text-anchor="middle" font-family="Bodoni" font-size="32" fill="$tube">street</text></g>
<g stroke="$gold" stroke-width="1.2" fill="none"><path d="M160 196 C145 196 135 192 118 195"/><path d="M260 196 C275 196 285 192 302 195"/></g>
<g fill="$gold"><path d="M110 195 l4 -4 l4 4 l-4 4z"/><path d="M302 195 l4 -4 l4 4 l-4 4z"/></g>
</g>
<use class="star" href="#$p-star8" x="210" y="30" fill="$star" stroke="$gold" stroke-width="1.5" filter="$filter"/>
</svg>'''

SIMPLE = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 30 400 240" role="img" aria-label="Strip Street">
<path d="M18 150 L120 48 Q210 34 300 48 L402 150 L300 252 Q210 266 120 252 Z" fill="$bg" stroke="$line" stroke-width="5"/>
<text x="210" y="172" text-anchor="middle" font-family="Anton" font-size="84" letter-spacing="5" fill="$fg">STRIP</text>
<text x="210" y="216" text-anchor="middle" font-family="Bodoni" font-size="38" fill="$accent">street</text>
</svg>'''

WORD = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 80" role="img" aria-label="Strip Street"><defs>''' + DEFS + '''</defs>
<use href="#$p-star8" transform="translate(22 40) scale(.8)" fill="$star"/>
<text x="48" y="62" font-family="Anton" font-size="60" letter-spacing="4" fill="$fg">STRIP</text>
<text x="182" y="62" font-family="Bodoni" font-size="46" fill="$accent">street</text>
</svg>'''

MARK = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="$vb" role="img" aria-label="Strip Street">$plate
<path d="M2 34 L18 16 Q32 13 46 16 L62 34 L46 52 Q32 55 18 52 Z" fill="#4A1530" stroke="#E7C98B" stroke-width="2.5"/>
<text x="32" y="46" text-anchor="middle" font-family="Anton" font-size="28" fill="#FFFFFF">S</text>
<path transform="translate(32 14.5)" d="M0 -8 L1.5 -2.5 L6 -5 L2.5 -1 L8 0 L2.5 1 L6 5 L1.5 2.5 L0 8 L-1.5 2.5 L-6 5 L-2.5 1 L-8 0 L-2.5 -1 L-6 -5 L-1.5 -2.5Z" fill="#FFE9B0"/>
</svg>'''

NEON = dict(bg='url(#$p-velvet)', gold='url(#$p-gold)', bulb='#FFE9B0', glow='#FF8FB0', white='#FFFFFF', neon='#E0446E',
            tube='#FFC2D3', star='#FFE9B0', filter='url(#$p-neon)', dice='1')
MONO = lambda c: dict(bg='none', gold=c, bulb=c, glow='none', white=c, neon='none', tube=c, star=c, filter='none', dice='0')

FILES = {
    'insegna.svg': (SIGN, NEON),
    'insegna-mono-chiaro.svg': (SIGN, MONO('#F6EEE9')),
    'insegna-mono-scuro.svg': (SIGN, MONO('#1A0F17')),
    'semplificato.svg': (SIMPLE, dict(bg='#4A1530', line='#E7C98B', fg='#FFFFFF', accent='#E0446E')),
    'semplificato-su-rosa.svg': (SIMPLE, dict(bg='#1A0F17', line='#E7C98B', fg='#FFFFFF', accent='#FF8FB0')),
    'semplificato-mono-chiaro.svg': (SIMPLE, dict(bg='none', line='#F6EEE9', fg='#F6EEE9', accent='#F6EEE9')),
    'semplificato-mono-scuro.svg': (SIMPLE, dict(bg='none', line='#1A0F17', fg='#1A0F17', accent='#1A0F17')),
    'logotipo.svg': (WORD, dict(fg='#FFFFFF', accent='#E0446E', star='#E7C98B')),
    'logotipo-su-chiaro.svg': (WORD, dict(fg='#1A0F17', accent='#C42F5A', star='#B8904A')),
    'simbolo.svg': (MARK, dict(vb='0 0 64 64', plate='')),
    'icona-app.svg': (MARK, dict(vb='-12 -12 88 88', plate='<rect x="-12" y="-12" width="88" height="88" rx="19" fill="#1A0F17"/>')),
}

def render(tpl, vals, prefix):
    vals = {k: Template(v).substitute(p=prefix) for k, v in vals.items()}
    return outline_all(Template(tpl).substitute(vals, p=prefix))

if __name__ == '__main__':
    OUT.mkdir(exist_ok=True)
    PUBLIC.mkdir(exist_ok=True)
    for name, (tpl, vals) in FILES.items():
        svg = render(tpl, vals, 'ss-' + name.split('.')[0])
        (OUT / name).write_text(svg, encoding='utf-8')
        print('scritto', OUT.name + '/' + name)
    (PUBLIC / 'favicon.svg').write_text((OUT / 'simbolo.svg').read_text(encoding='utf-8'), encoding='utf-8')
    (PUBLIC / 'icona-app.svg').write_text((OUT / 'icona-app.svg').read_text(encoding='utf-8'), encoding='utf-8')
    print('scritto public/favicon.svg, public/icona-app.svg')
