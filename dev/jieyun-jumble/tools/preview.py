#!/usr/bin/env python3
"""Render every SPR.<id> = [...] sprite in a JS file to a labelled PNG sheet.
usage: preview.py file.js [scale]   -> writes file.png next to it.
Digits 1-4 are recolorable slots (shown in default slot colors)."""
import sys, re, json, os
from PIL import Image, ImageDraw
pal = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'art', 'palette.json')))
src = open(sys.argv[1]).read()
scale = int(sys.argv[2]) if len(sys.argv) > 2 else 6
sprites = []
for m in re.finditer(r'SPR\.(\w+)\s*=\s*\[(.*?)\];', src, re.S):
    rows = re.findall(r'"([^"]*)"', m.group(2))
    sprites.append((m.group(1), rows))
errs = []
for name, rows in sprites:
    if not rows: errs.append(f'{name}: empty'); continue
    w = len(rows[0])
    for i, r in enumerate(rows):
        if len(r) != w: errs.append(f'{name}: row {i} width {len(r)} != {w}')
        for ch in r:
            if ch != '.' and ch not in pal: errs.append(f'{name}: bad char {ch!r} row {i}')
for e in errs: print('ERROR', e)
cell_w = max([len(r[0]) for _, r in sprites] + [12]) * scale + 16
cols = max(1, min(6, 1100 // cell_w))
rowsN = (len(sprites) + cols - 1) // cols
cell_h = max([len(r) for _, r in sprites] + [12]) * scale + 30
img = Image.new('RGB', (cols * cell_w, rowsN * cell_h), '#6b7a8f')
d = ImageDraw.Draw(img)
for idx, (name, rows) in enumerate(sprites):
    cx, cy = (idx % cols) * cell_w + 8, (idx // cols) * cell_h + 4
    w, h = len(rows[0]), len(rows)
    for y in range(h):
        for x in range(w):
            bg = '#9aa7b8' if (x + y) % 2 else '#8795a8'
            d.rectangle([cx + x*scale, cy + y*scale, cx + (x+1)*scale - 1, cy + (y+1)*scale - 1], fill=bg)
            ch = rows[y][x] if x < len(rows[y]) else '.'
            if ch != '.' and ch in pal:
                d.rectangle([cx + x*scale, cy + y*scale, cx + (x+1)*scale - 1, cy + (y+1)*scale - 1], fill=pal[ch])
    d.text((cx, cy + h*scale + 3), f'{name} {w}x{h}', fill='#000000')
out = os.path.splitext(sys.argv[1])[0] + '.png'
img.save(out)
print(f'{len(sprites)} sprites -> {out}' + (f' ({len(errs)} errors)' if errs else ''))
