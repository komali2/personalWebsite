#!/usr/bin/env python3
"""Assemble games/taiwan-treats-trip/index.html from src/*, art/*.js and a font subset.

usage: python3 tools/build.py            (run from anywhere)
The font subset contains only the characters used in the page, so rebuild after text changes.
"""
import base64, glob, io, os, re, subprocess, sys, urllib.request
from fontTools import subset
from fontTools.ttLib import TTFont

DEV = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(os.path.dirname(DEV))
OUT = os.path.join(REPO, 'games', 'taiwan-treats-trip', 'index.html')
FONT_SRC = os.path.join(DEV, 'font', 'Cubic_11.ttf')
FONT = os.path.join(DEV, 'font', 'Cubic_11_tones.ttf')
FONT_URL = 'https://raw.githubusercontent.com/ACh-K/Cubic-11/main/fonts/ttf/Cubic_11.ttf'

def ensure_font():
    if os.path.exists(FONT): return
    if not os.path.exists(FONT_SRC):
        print('downloading Cubic 11 ...'); urllib.request.urlretrieve(FONT_URL, FONT_SRC)
    subprocess.check_call([sys.executable, os.path.join(DEV, 'tools', 'patch_font.py'), FONT_SRC, FONT])

def main():
    parts = [open(p, encoding='utf-8').read() for p in sorted(glob.glob(os.path.join(DEV, 'src', '*')))]
    art = []
    for name in ('snacks', 'actors', 'props'):
        p = os.path.join(DEV, 'art', name + '.js')
        if os.path.exists(p):
            src = open(p, encoding='utf-8').read()
            # keep only the sprite assignments (drop comments)
            art += [m.group(0) for m in re.finditer(r'SPR\.\w+\s*=\s*\[.*?\];', src, re.S)]
        else:
            print('warning: missing art/' + name + '.js')
    art_js = '<script>\n/* ---- pixel art: one char per pixel, palette keys in PAL_KEYS ---- */\n' + '\n'.join(
        re.sub(r'\s*\n\s*', '', a) for a in art) + '\n</script>\n'
    page = ''.join(parts) + art_js
    lic = open(os.path.join(DEV, 'font', 'OFL.txt'), encoding='utf-8').read()

    ensure_font()
    chars = set(page) | set(lic) | set(''.join(chr(c) for c in range(32, 127))) | set('āáǎàēéěèīíǐìōóǒòūúǔùü×·…→←↑—’“”')
    font = TTFont(FONT)
    opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = []; opts.name_IDs = ['*']; opts.notdef_outline = True
    sub = subset.Subsetter(opts); sub.populate(text=''.join(sorted(chars))); sub.subset(font)
    bio = io.BytesIO(); font.flavor = 'woff2'; font.save(bio)
    b64 = base64.b64encode(bio.getvalue()).decode()
    lic_js = lic.replace('\\', '\\\\').replace('`', "'").replace('${', '$ {')
    font_js = ('<script>\n/* Cubic 11 (OFL-1.1) subset with added pinyin tone vowels; regenerate with dev/taiwan-treats-trip/tools/build.py */\n'
               f'const LICENSE_TEXT = `{lic_js}`;\nconst FONT_B64 = "{b64}";\n</script>\n')
    html = page + font_js + '</body>\n</html>\n'
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, 'w', encoding='utf-8').write(html)
    print(f'wrote {OUT}: {len(html)//1024} KB (font {len(b64)//1024} KB, {len(art)} sprites)')

if __name__ == '__main__':
    main()
