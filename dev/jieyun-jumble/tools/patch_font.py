#!/usr/bin/env python3
"""Add pinyin tone vowels missing from Cubic 11 (ā ǎ ē ě ī ǐ ū ǔ) by compositing pixel bitmaps.
Accents are lifted from ō/ǒ (which the font has). Output: Cubic_11_tones.ttf"""
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.pointInsidePen import PointInsidePen
from fontTools.pens.ttGlyphPen import TTGlyphPen
U = 100
src, dst = sys.argv[1], sys.argv[2]
f = TTFont(src); cmap = f.getBestCmap(); gs = f.getGlyphSet()
def bitmap(ch):
    gn = cmap[ord(ch)]; adv = f['hmtx'][gn][0]; px = set()
    for x in range(0, adv, U):
        for y in range(-400, 1100, U):
            pen = PointInsidePen(gs, (x + U/2, y + U/2)); gs[gn].draw(pen)
            if pen.getResult(): px.add((x // U, y // U))
    return px, adv
o, _ = bitmap('o')
macron = bitmap('ō')[0] - o
caron = bitmap('ǒ')[0] - o
def mk(name, uni, base_ch, accent, strip_dot=False):
    px, adv = bitmap(base_ch)
    if strip_dot:  # i -> dotless: drop pixels above the x-height gap
        top = max(y for _, y in px); stem = [p for p in px if p[1] <= 4]
        px = set(stem)
    cols = sorted({x for x, y in px if y >= 2}); cx = (cols[0] + cols[-1]) / 2
    ax = sorted({x for x, _ in accent}); acx = (ax[0] + ax[-1]) / 2
    dx = round(cx - acx)
    px |= {(x + dx, y) for x, y in accent}
    minx = min(x for x, _ in px)
    if minx < 0: px = {(x - minx, y) for x, y in px}; adv += -minx * U
    adv = max(adv, (max(x for x, _ in px) + 2) * U)
    pen = TTGlyphPen(None)
    for x, y in sorted(px):
        X, Y = x * U, y * U
        pen.moveTo((X, Y)); pen.lineTo((X, Y + U)); pen.lineTo((X + U, Y + U)); pen.lineTo((X + U, Y)); pen.closePath()
    f['glyf'][name] = pen.glyph(); f['hmtx'][name] = (adv, 0)
    order = f.getGlyphOrder()
    if name not in order: order.append(name); f.setGlyphOrder(order)
    for t in f['cmap'].tables:
        if t.isUnicode(): t.cmap[uni] = name
for name, uni, base, acc, sd in [
    ('amacron', 0x101, 'a', macron, False), ('uni01CE', 0x1CE, 'a', caron, False),
    ('emacron', 0x113, 'e', macron, False), ('uni011B', 0x11B, 'e', caron, False),
    ('imacron', 0x12B, 'i', macron, True), ('uni01D0', 0x1D0, 'i', caron, True),
    ('umacron', 0x16B, 'u', macron, False), ('uni01D4', 0x1D4, 'u', caron, False)]:
    mk(name, uni, base, acc, sd)
if 'DSIG' in f: del f['DSIG']
f['maxp'].numGlyphs = len(f.getGlyphOrder())
f.save(dst); print('saved', dst)
