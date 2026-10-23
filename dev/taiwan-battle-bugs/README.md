# Taiwan Battle Bugs 台灣鬥蟲

**Play:** https://www.calebjay.com/games/taiwan-battle-bugs/ (phone first; it also works on desktop)

Pick a real Taiwanese bug and climb three tea bushes. Choose a branch at every fork, eat the tastiest leaves, fight the bugs guarding them, and level up. When your belly is full, the tea farmer **阿珠姨 Auntie A-Zhu** shows up with a slipper, then an electric mosquito racket, then a pesticide sprayer. Beat her three times and her hat is yours.

## How it plays

- **Forks:** tap or swipe a branch (arrow keys on desktop). Leaf stars are always visible. Most guards show as silhouettes sized by strength, but some hide in ambush. The tastiest leaves are usually guarded, because bug-bitten tea really does taste best: Oriental Beauty 東方美人 tea gets its honey aroma from leafhopper bites.
- **Fights:** each fighter has an action gauge. Tap **Basic** or your bug's **Special** when it's full (taps queue up; keys 1/2/3 on desktop). The enemy's next move shows next to its gauge, and big moves wind up first. **Super** charges as you deal and take damage. It fires instantly and can interrupt a wind-up.
- **Growth:** level-ups and tasty or hard-won leaves give stat points. Spend them on Attack, Sp. Attack, HP or Speed from the tray at each fork.
- **Bugs:** 獨角仙 rhino beetle, 寬腹螳螂 giant Asian mantis, 荔枝椿象 lychee stink bug, 小綠葉蟬 tea leafhopper and 人面蜘蛛 golden orb-weaver. Each has its own special, super and field trait. Everything is drawn at its size relative to you, so the leafhopper gets a terrifying view of everything.
- **Extras:** a bug log 圖鑑 with real facts and a glossary of Auntie's 台語 lines, a share button, and the UI in English or 中文.

## Make it yours

The game ships as one self-contained file, `games/taiwan-battle-bugs/index.html`: vanilla Canvas 2D, no libraries, no network once loaded. It is built from this folder:

| path | what |
|---|---|
| `src/1_head.html` | markup and CSS |
| `src/2_data.js` | bugs, enemies, Auntie's devices, balance numbers, save data |
| `src/2b_text.js` | bug log facts, Auntie's 台語 lines, eating quips |
| `src/2c_i18n.js` | UI strings in English and Taiwan Mandarin |
| `src/3_gfx.js` … `src/7_ui.js` | sprites and sound, world, combat, run flow, rendering, effects, UI |
| `art/*.js` | pixel art as text grids, one palette character per pixel (`art/palette.json`) |
| `tools/` | build, preview, smoke test and balance sim |
| `PROGRESS.md` | the full design, status and a handoff guide for agents |

```sh
python3 tools/build.py              # src + art + font subset -> games/taiwan-battle-bugs/index.html
python3 tools/preview.py art/bugs.js # render a sprite sheet PNG and validate the grids
cd tools && npm install             # playwright-core, for the headless tools below
node tools/shot.js                  # smoke test through every phase + screenshots (needs /usr/bin/chromium)
node tools/sim.js 16 all            # autopilot balance sim for all five bugs
```

Requirements: Python 3 with `fonttools` and `brotli`; Pillow for `preview.py`; Node for the tests. Edit `src/` and rebuild; don't edit `index.html` by hand.

## Credits and license

- Made by [Caleb Rogers](https://www.calebjay.com) with AI agents (Claude and GPT) for code, pixel art, writing and synthesized sound. Sister game of [Taiwan Treats Trip](../taiwan-treats-trip/).
- Caleb builds software with [508.dev](https://508.dev), an engineering co-op, and **we're looking for engineers**.
- Code and art: **GPL-3.0-or-later** (see `LICENSE`).
- Font: [Cubic 11 俐方體11號](https://github.com/ACh-K/Cubic-11), SIL Open Font License 1.1 (`font/OFL.txt`).
