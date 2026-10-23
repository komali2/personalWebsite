# Jieyun Jumble 捷運大風吹 — progress tracker

Read this first if you are picking the work up (any agent, any provider).

- **License:** GPL-3.0-or-later (`LICENSE`), for code and pixel art. The embedded Cubic 11 font stays OFL-1.1.
- **Ship target:** `games/jieyun-jumble/index.html` (one self-contained file, vanilla Canvas 2D, no CDN). Unlisted on the homepage.
- **Branch:** `feat/jieyun-jumble`. Caleb asked for **regular pushes to this branch** so he can follow along from his laptop, and authorized frequent `deploy.sh` deploys (FTP mirror to calebjay.com) once the headless smoke test passes: https://www.calebjay.com/games/jieyun-jumble/ . Do not merge to master without asking.
- **Dev workspace:** this folder (`dev/` is excluded from deploy). Sister games: `dev/taiwan-treats-trip/`, `dev/taiwan-battle-bugs/` (same pipeline; copy patterns from them).
- **Token budget matters.** Art and text go to opencode with OpenAI models via paseo; Claude writes the code. Update this file after every milestone.

## Settled design (from the /grilling session, 2026-10-23; do not re-litigate)
- **Pitch:** a Queens puzzle on a schematic Taipei MRT map. Place one commuter per row, per column and per line's area; no two commuters touch, diagonals included. When you solve it, the trains pull out, every line's area reflows, and you solve again.
- **Regions = catchments:** each line has one train on its track; every block belongs to the train that reaches it first, mostly along its own track (regions stretch along their lines). Regions are tinted in line colors and carry the real line code (BR, R, G…) for color-blind play.
- **Solve → reshuffle:** every train moves 0–3 stops (bouncing at the ends). Commuters who are also in the new solution stay as locked **regulars** (1–3 per board); the rest get off. Fresh boards (new size) start with the fewest waiting commuters that make the solution unique. Every board has exactly one solution and logic alone solves it (graded by the same engine that writes hints). Future Hard Mode: keep every commuter and repair the board.
- **Map:** one hand-made layout per board size following the real network (transfers are real), bent to the grid like the official map (`src/2a_map.js`, editable). Tapping a block shows its station(s).
- **Run = one service day:** 06:00 → 24:00 in ~10 real minutes. Board starts 5×5 with BR R G O BL; every 2 solves the next line opens in its real order (A 2017, V 2018, Y 2020, K 2023) up to 9×9, with an opening banner.
- **Pressure:** a platform crowd carries over between boards; arrivals follow the time of day (surges 07–09 and 17–19). Each solve boards a carload proportional to the board size; emptying the platform (月台淨空) is a big bonus; 客滿 (overflow) ends the run; reaching the last train clears the day. Hints let more people onto the platform.
- **Score:** commuters carried (boarded + seated), ×2 at rush hour, + platform-clear bonus, + lost riders delivered.
- **Feedback:** illegal plays show instantly (striped cells, glaring commuters, rules strip flashes, a clash joke) with no buzzer and no penalty. Legal pieces that aren't in the solution are only revealed by a hint. Hint 1 flags wrong commuters and ✕s on cells the solution needs, else shows the next logical step with a one-line reason; hint 2 places a commuter. No skip.
- **Input:** tap cycles empty → ✕ → commuter; drag paints ✕; undo and clear buttons; auto-✕ setting (off by default). Desktop: click/drag, Z = undo.
- **Riders:** a signature rider per line (`content.js`). **Lost riders** (suitcase traveler wanting the Airport line, an 阿嬤 headed to 龍山寺 speaking 台語…) stand as regulars in the wrong line's area for several boards until their line's area reaches them (fallback: they ask someone and walk off). Caleb proofreads 台語.
- **Learning without a tutorial:** always-visible rules strip (row · column · line · personal space) that lights up/flashes, an easy first 5×5, the attract-mode demo, rules in About.
- **Between runs:** 紀念章 station stamp book (every station a train stops at; one true fact each; code-drawn stamps with landmark icons) + Lost & Found page; best score; daily streak; share button.
- **Daily day:** 今日 Today = one seeded day per date (Taiwan time), identical on every phone (step-counted integer generator, per-board rng streams; no server). Share line like `台北 2026-10-23 · 142 commuters · 3 platform clears`. Freeze the daily generator once shipped (version tag in the share text).
- **Flavor:** LED next-station ticker (Chinese + English like the real signs), accurate door-closing beeps + an original arrival chime (not Taipei Metro's melodies: copyright gray area, and we don't remember them note-perfect), time-of-day sky with 101 lit at night, MRT etiquette jokes in clash messages.
- **Layout (portrait):** top HUD (clock with rush glow, score, pause, mute) · LED ticker · skyline · platform strip (crowd fills toward 客滿; on a solve a train pulls in and a carload boards) · the N×N map board · rules strip · [undo] [clear] [hint]. The board hides while paused.
- **Extras (same as TTT/TBB):** EN/中文 switch, GoatCounter, About, README, mute + reduced-motion toggles, title screen with an attract-mode demo, sound effects only. No tutorial. Run resumes if the tab is killed.

## Files
| path | what |
|---|---|
| `content.js` | **editable content**: riders, lost riders and their lines, ticker phrases, clash jokes, station facts, stamp icons |
| `src/1_head.html` | `<head>`, CSS, DOM for HUD and screens |
| `src/2_data.js` | palette, utils, save |
| `src/2a_map.js` | lines, stations, the five layouts (`MAPS`), parser + checker (**editable**) |
| `src/2c_i18n.js` | UI strings `STR.en`/`STR.zh`, `T()`, `applyLang()` |
| `src/3_gfx.js` | sprite cache `spr()`, pixel text, WebAudio `AU`/`SFX` |
| `src/4_puzzle.js` | pure logic: catchment, solver, deduction engine (grading + hints), generator |
| `src/4b_run.js` | pure logic: the service day (clock, crowd, line openings, lost riders, score) |
| `src/5_*.js`, `6_*.js`, `7_ui.js` | play state, rendering, UI, main loop |
| `art/*.js` | sprites as `SPR.id = ["..k..", ...];` grids. Palette: `art/palette.json` (Endesga-32, one char per color) |
| `tools/build.py` | `python3 tools/build.py` → `games/jieyun-jumble/index.html`. Edit src/ and rebuild; never edit index.html |
| `tools/core.js` | loads the pure-logic files into node |
| `tools/gen_sim.js` | `node tools/gen_sim.js 30 [--show]`: generator stats on the real layouts (tries, time, levels, regulars, reshuffle) |
| `tools/balance.js` | `node tools/balance.js 40`: simulated fast/avg/slow players play seeded days (survival, clears, lost riders) |
| `tools/preview.py` | `python3 tools/preview.py art/X.js 6` renders a PNG sheet and validates grids |
| `tools/shot.js` | headless chromium smoke test + screenshots |

## Status
- [x] Design grilling (2026-10-23)
- [x] Workspace + tools copied from TBB
- [x] Feasibility: catchment maps are rarely unique on their own (9×9 ≈ 0.5%), but with 1–3 locked commuters 34–72% of maps work; chained boards with regulars find a board in ~50 ms (9×9 worst ≈ 0.35 s in node)
- [x] Real layouts 5×5 → 9×9 (`src/2a_map.js`), all transfers real
- [x] Generator + run logic + sims (30 days: no failures; 5×5 lv0–1, 7×7+ mostly lv3)
- [ ] Balance: crowd load/fill sweep (in progress)
- [ ] Art (dispatched to opencode/openai): `art/riders.js`, `art/scene.js`
- [ ] Text (dispatched): `content.js` facts, clash jokes, more lost riders
- [ ] Code: play UI, rendering, HUD, title/attract demo, stamp book, daily, share
- [ ] Headless smoke test, deploy, push

## Generator and balance knobs
`CATCH` (walk vs track cost), `lay.reach` per line, `GEN` (tries, solutions examined) in `src/4_puzzle.js`; `WANT` (difficulty band and regulars per size), `DAY` (day length, crowd cap, carload, hint costs, arrivals by time), `LOST_RULE` in `src/4b_run.js`.

## Agent log
- 2026-10-23: workspace created; generator feasibility proven; layouts written; art and text dispatched to opencode/openai/gpt-6.1-sol via paseo.

---

## Art spec (for whoever draws)
**Format:** each sprite is `SPR.<id> = [ "row", "row", ... ];` in the named file, one character per pixel, `.` = transparent, every row exactly the stated width, exactly the stated height. Only palette keys from `art/palette.json` (`k n N g G l w r R p s o y Y e E f F b B c m M t T u U v P q S z`); digits `1`–`4` only where a spec says "slot" (recolored in code). Validate with `python3 tools/preview.py art/<file>.js 6` (zero errors) and look at the PNG at 6× and at 1×.
**Style:** same as `dev/taiwan-treats-trip/art/*.js` and `dev/taiwan-battle-bugs/art/*.js` (look at their PNGs): Endesga-32, light from the top-left, selective outline (mostly `k`, or a darker shade of the local color), 2–4 shades per material, crisp readable silhouettes, no dithering noise. The game renders on a ~180 px wide canvas scaled up by an integer factor, so tiny sprites must read at 1×. No text in sprites. Contemporary Taipei, cute and a little funny.

### `art/riders.js` — people (21 sprites)
**Riders, 16×16 each**, standing, facing the viewer (3/4 front is fine), full body, feet on the bottom row, about 13–15 px tall, chunky chibi proportions (big head ≈ 6–7 px), `k` outline. They sit inside one map cell (≈19 px), so the silhouette and the one prop must read at 1×. Each must be distinct in silhouette and dominant color, and include a little of their line's color (official: BR brown, R red, G green, O orange, BL blue, A purple, V vermilion, Y yellow, K khaki):
- `r_BR` Neihu tech engineer: hoodie, lanyard badge, laptop under the arm, tired eyes.
- `r_R` night-market foodie: holding a giant fried chicken cutlet 大雞排 (bigger than their head) in a paper bag.
- `r_G` university student (公館, NTU): backpack, glasses, bubble tea in hand.
- `r_O` auntie with a 菜籃車 (folding shopping trolley with veggies sticking out), permed hair, floral top.
- `r_BL` office worker: white shirt, dark tie, holding a 便當 lunch box, slightly hunched.
- `r_A` traveler: sunglasses on head, rolling suitcase beside them, neck pillow.
- `r_V` sunset photographer: big camera, bucket hat, vest.
- `r_Y` food-delivery rider: helmet with visor up, big square insulated backpack (no brand logos; use a generic color like `o` or `q`).
- `r_K` elementary schoolkid: yellow safety hat 小黃帽, oversized backpack, small and bouncy.
**Lost riders, 16×16**, same style, each visibly lost (a `?` is drawn by code, not in the sprite):
- `l_suitcase` foreign traveler with a huge suitcase and a paper map, sweaty.
- `l_ama` 阿嬤 grandma: short permed grey hair, floral blouse, holding a red-and-white woven nylon bag (茄芷袋), tiny and determined.
- `l_tourist` tourist with a sun hat, camera on neck, holding a fold-out map upside down.
- `l_student` high-school student in a Taiwanese school uniform (white shirt, dark shorts/skirt), running pose, toast in mouth.
- `l_kid` small kid holding a balloon, looking up (lost on the way to the zoo).
- `l_abo` 阿伯 grandpa: white tank top, flip-flops 藍白拖, holding a birdcage or a thermos of tea.
**Crowd people, 7×11 each** (`c_1` … `c_6`): tiny generic commuters seen from the front for the platform crowd: varied hair, clothes and accessories (umbrella, phone, backpack, cap, shopping bag). Use slot digits `1` for the top/shirt and `2` for pants/skirt so the code can recolor them. Readable at 1×.

### `art/scene.js` — scenery and icons (≈40 sprites)
- `sky_city` 224×56: Taipei skyline silhouette for the top of the screen, transparent sky. Left to right: green mountains (Yangmingshan) in the far back; apartment blocks with rooftop water tanks and iron window grilles; the Grand Hotel (red Chinese palace roof on a hill) on the left third; Taipei 101 (the bamboo-segment tower with its spire, tallest, around x≈150), lower office towers around it; Elephant Mountain (象山) slope on the far right. Use mid/dark tones (`N g G n f F E u U v l`), not black; the code tints it for dawn/day/sunset/night.
- `sky_lights` 224×56: same canvas, transparent except the lights you'd see at night: scattered lit windows (`Y y t`), red aircraft lights on the spires, and 101's colored segment lights (a band of `c B q Y` on each bamboo segment). Must line up with `sky_city` pixel for pixel.
- `pf_door` 24×22: one bay of an MRT platform with a platform screen door (glass panels `l G w c` with dark frames `N n`, the yellow "mind the gap" strip at the bottom `Y y`). Tiles horizontally.
- `pf_train` 48×22: side view of a Taipei MRT train car (silver/white body `l w G`, a band of slot color `1` along the windows, dark windows `n N` with a couple of passenger silhouettes, doors). The code slides it across the platform; slot 1 = line color.
- Stamp icons, 16×16, readable at 1× and 2×, single centered motif, outline `k`, no background (the code draws the stamp ring): `st_101` (Taipei 101), `st_temple` (Longshan Temple roof with dragons), `st_panda` (Taipei Zoo panda), `st_plane` (airplane), `st_wharf` (Tamsui Fisherman's Wharf Lover's Bridge), `st_sunset` (sun on the sea), `st_cutlet` (night-market chicken cutlet / snack stall), `st_books` (university: book and graduation cap), `st_bridge` (river bridge), `st_mountain` (green mountain), `st_hall` (Chiang Kai-shek Memorial Hall: white with a blue octagonal roof), `st_wheel` (Miramar ferris wheel, Dazhi), `st_spring` (Beitou hot spring steam), `st_train` (front of an MRT train), `st_tower` (office tower), `st_market` (market cart with vegetables), `st_dome` (Taipei Arena), `st_lantern` (red lantern), `st_tree` (park tree, Daan Forest Park), `st_tea` (bubble tea cup), `st_cat` (cat), `st_bike` (YouBike-style shared bike, orange `o`/yellow `y`, no logo).
- UI icons, 12×12, outline `k`, readable at 1×: `ic_row` (a horizontal bar of 3 dots, one highlighted), `ic_col` (vertical version), `ic_line` (a small colored map blob with a pin), `ic_space` (two little people with a gap and arrows ↔), `ic_hint` (light bulb `Y`), `ic_undo` (curved arrow back), `ic_clear` (broom or circular arrows), `ic_pause`, `ic_sound`, `ic_mute`, `ic_book` (stamp book), `ic_today` (calendar page), `ic_auto` (a small ✕ with a sparkle), `ic_people` (crowd of 3 heads), `ic_clock`.
- `mk_x` 7×7: the ✕ mark players put on cells (`N` with `k` outline, slightly hand-drawn), `mk_x2` 7×7 the same in `R` (flagged as wrong by a hint).
- `fx_sweat` 5×5 (sweat drop `c`/`B`), `fx_angry` 5×5 (anger vein `R`), `fx_heart` 5×5 (`p`), `fx_q` 5×7 (a `?` in `Y` with `k` outline, for lost riders), `fx_star` 7×7 (sparkle `Y w`).

## Text spec (`content.js`)
Plain JS inside `<script>` like the existing file; keep every existing key and comment, keep the structures. Rules: EN first-class and natural; zh is Taiwan Mandarin (臺灣用語); 台語 in Han characters using MOE recommended characters (教育部推薦用字) with Tâi-lô in `tl` (Caleb proofreads). No pronouns for riders except "they". Funny, warm, not mean.
- `FACTS`: one entry for **every station id in `STN` in `src/2a_map.js`** (≈65): `{ en, zh, icon }`. One true, specific, fun sentence each (≤ 140 chars EN, ≤ 60 字 zh) about the station or its neighborhood (history, a famous spot, a quirk of the station itself). Verify every fact (use web search if your tools allow); no invented numbers. `icon` = one of the `st_*` stamp icons above that fits best.
- `CLASH`: 5 entries per kind (`touch`, `row`, `col`, `line`), ≤ 44 chars EN / 18 字 zh, MRT etiquette jokes where possible (priority seats 博愛座, no eating or drinking past the yellow line (fine up to NT$7,500), stand on the right on escalators, queue lines painted on the platform, backpacks in front, don't hold the doors, etc.). Facts in them must be true.
- `LOST`: keep the four, add `kid` (wants `BR`, to the zoo; voice `zh`) and `abo` (wants `O`, to 行天宮 Xingtian Temple; voice `tw`). `ask`/`thanks` ≤ 48 chars EN, `tw` ≤ 14 Han characters. Note: `want` must be a line id; `need` optional.
- `TICKER`: add `rush` (`{en, zh}`, e.g. 尖峰時段 notice), `clear` (platform cleared), `full` (platform full warning when crowd is high), `last` (last train announcement), `open` (`{line}` opens, `{year}`), each ≤ 40 chars EN.
- Append a proofreading table (台語 lines: key | 台語 | Tâi-lô | English) as a comment at the end of `content.js` and in this file under "Lines for proofreading".
