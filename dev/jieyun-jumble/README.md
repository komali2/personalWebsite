# Jieyun Jumble 捷運大風吹

**Play:** https://www.calebjay.com/games/jieyun-jumble/ (phone first; it also works on desktop)

A Queens-style logic puzzle on the Taipei MRT map. Seat one commuter in every row, every column and every line's area, and keep them from touching (diagonals included: personal space). Solve it, and the train boards the waiting crowd while every line moves on. The colored areas reshuffle, and you solve again before the platform fills up. 大風吹 is the kids' game where everyone swaps seats.

## How it plays

- **The map:** each colored area belongs to the train inside it (the line-code badge). The areas follow the tracks, so they look like their lines. The layouts follow the real network, and every transfer is a real transfer. The board starts downtown on 5×5 with the five oldest lines. Every two solves the next line opens in its real order (Airport MRT 2017, Danhai LRT 2018, Circular Line 2020, Ankeng LRT 2023), up to 9×9.
- **Controls:** tap a block once for ✕, twice for a commuter, three times to empty it. Drag to paint ✕s. Undo, clear and hint are below the board (Z and H on desktop). Commuters already standing when a board appears are **regulars** (locked). They stayed because they're still in the right place.
- **The day:** 06:00 to midnight in about ten minutes. People keep arriving on the platform, faster at rush hour (07–09 and 17–19, when scores count double). Each solve boards a carload. Empty a crowded platform for a 月台淨空 bonus. If it fills up (客滿), the day is over; if you make it to the last train, you win the day.
- **Hints:** the first press points out a mistake, or the next logical step with a reason. Press again and it places a commuter. Hints let more people onto the platform.
- **Lost riders:** once all nine lines are open, someone lost may be standing in the wrong line's area: a traveler looking for the Airport MRT, an 阿嬤 headed to 龍山寺… They wait while the map reshuffles around them until their line reaches them.
- **Extras:** a 紀念章 stamp book (every station a train stops at, with a real fact), Lost & Found, **今日 Today** (one seeded day per date, the same on every phone), a share button, the UI in English or 中文, and an auto-✕ helper in the pause menu.

## Make it yours

The game ships as one self-contained file, `games/jieyun-jumble/index.html`: vanilla Canvas 2D, no libraries, no network once loaded. It is built from this folder:

| path | what |
|---|---|
| **`content.js`** | **riders, lost riders and their lines, ticker phrases, clash jokes, station facts and stamp icons: the easy place to change things** |
| **`src/2a_map.js`** | **the lines, stations and the five board layouts (`MAPS`), in a readable `cell:station` format** |
| `src/1_head.html` | markup and CSS |
| `src/2_data.js` | palette, region tints, save data |
| `src/2c_i18n.js` | UI strings in English and Taiwan Mandarin |
| `src/4_puzzle.js` | catchment regions, solver, the logic engine behind hints and grading, the board generator |
| `src/4b_run.js` | the service day: clock, crowd, line openings, lost riders, score (balance numbers in `DAY` and `WANT`) |
| `src/3_gfx.js`, `src/5_play.js` … `src/7_ui.js` | sprites and sound, play, rendering, effects, UI |
| `art/*.js` | pixel art as text grids, one palette character per pixel (`art/palette.json`) |
| `tools/` | build, content check, preview, smoke test, generator and balance sims |
| `PROGRESS.md` | the full design, status and a handoff guide for agents |

```sh
python3 tools/build.py               # checks content.js, then src + art + font subset -> games/jieyun-jumble/index.html
python3 tools/preview.py art/riders.js # render a sprite sheet PNG and validate the grids
node tools/gen_sim.js 30 --show      # generator stats on the real maps (and ASCII boards)
node tools/balance.js 40             # simulated fast/average/slow players play seeded days
cd tools && npm install              # playwright-core, for the headless smoke test
node tools/shot.js                   # smoke test through every screen + screenshots (needs /usr/bin/chromium)
```

Requirements: Python 3 with `fonttools` and `brotli`; Pillow for `preview.py`; Node for the tools. Edit `src/` or `content.js` and rebuild; don't edit `index.html` by hand.

Every board has exactly one solution, and logic alone solves it (no guessing). The generator is integer-only and counts its steps rather than timing them, so the daily day comes out identical on every phone without a server.

## Credits and license

- Made by [Caleb Rogers](https://www.calebjay.com) with AI agents (Claude and GPT) for code, pixel art, writing and synthesized sound. Sister game of [Taiwan Treats Trip](../taiwan-treats-trip/) and [Taiwan Battle Bugs](../taiwan-battle-bugs/).
- Caleb builds software with [508.dev](https://508.dev), an engineering co-op, and **we're looking for engineers**.
- Not affiliated with Taipei Metro. Track colors are the official line colors; the arrival chime is our own tune.
- Code and art: **GPL-3.0-or-later** (see `LICENSE`).
- Font: [Cubic 11 俐方體11號](https://github.com/ACh-K/Cubic-11), SIL Open Font License 1.1 (`font/OFL.txt`).
