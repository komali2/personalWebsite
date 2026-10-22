# Taiwan Treats Trip 吃飽逃颱 — progress tracker

Read this first if you are picking the work up (any agent, any provider).

- **License:** GPL-3.0-or-later (`LICENSE`), for code and pixel art. The embedded Cubic 11 font stays OFL-1.1.
- **Ship target:** `games/taiwan-treats-trip/index.html` (one self-contained file, vanilla Canvas 2D, no CDN).
- **Branch:** `feat/taiwan-treats-trip`. Do not merge or push without asking Caleb. Caleb authorized running `deploy.sh` (FTP mirror to calebjay.com) and checking the live URL afterwards: https://www.calebjay.com/games/taiwan-treats-trip/
- **Dev workspace:** this folder (`dev/`, excluded from deploy via `-X dev/` in deploy.sh).
- **Token budget matters.** Split work across providers (opencode with OpenAI models for high-level or creative work; cheaper models for grunt work). Update this file after every milestone.

## Settled design (do not re-litigate)
- **View and controls:** top-down portrait vertical scroller. Relative-drag steering (arrows/A-D plus Space on desktop). **No tutorial and no hint text**; the UI should explain itself.
- **Belly meter is fuel:** speed follows belly, and snacks refill it. Typhoon "Hangry" 颱風餓餓 is a storm wall at the bottom of the screen; touching it means caught. Its "arms" darken some fork branches, with rain, gusts and blowing snacks, and the storm speeds up while you are in one.
- **Forks every ~10 s:**
  - Signs show partial info: snack amount pips 1–3, a specialty icon, and 🌀 if the branch is stormy. Hazards stay hidden.
  - Snack-rich branches are twistier or stormy.
  - Jeremy's drone reveals the full info.
- **Score:** snack points × combo (combo resets on a hit and decays after about 2 s without a pickup). Distance is shown but not scored.
- **Hits never end a run:** spin-out, belly drain, and 2 snacks spill onto the road (they can be re-grabbed). Macaques steal a snack instead.
- **Endless run, ~60 s per region:**
  - Region graph: Taipei → Taichung → Wuling Farm → {Jiufen, Taroko Gorge, Taitung}. Jiufen → {Taipei, Taroko}. Taroko → Hualien → Taitung → Kaohsiung → Taichung.
  - The gate at the end of a region is a fork whose signs show the destination names.
  - Difficulty scales with regions cleared.
- **Crew:** Jeremy (drone, magnet + reveal), Riley (hack: knocks Hangry back and freezes it), Caleb (too cool: slow motion), Lauren (whimsy: hazards become snacks), Rachel (kung fu: invulnerable dash that kicks hazards). The leader's ability charges by eating.
- **Vehicles:**
  - **Hatchback:** caught = game over.
  - **Scooter squad:** five scooters in a conga line. Hangry eats the rear scooter (that friend is lost), and the run ends when only the leader is left and gets caught. A lost friend rarely waits at a bus stop to rejoin.
- **Hazards:** Taipei scooter swarms, rocks and landslides, tour buses, Taroko macaques, Jiufen crowds, gravel trucks, stray dogs, plus **blue trucks 藍色小貨車 everywhere** (they honk, overtake, swerve, cut you off, and sometimes drop cargo snacks).
- **Text:** English first, with traditional characters alongside. Place names follow Taiwanese road-sign spelling; snack names use Hanyu Pinyin with tone marks. The crew text uses **no pronouns**.
- **Screens:** title (attract-mode demo), vehicle and leader select, HUD (score, combo, belly, storm meter, minimap, ability button, crew), game over (traced route map, tally, crew quips, share via navigator.share or the clipboard), snack log 圖鑑 (localStorage), credits (OFL notice). Mute and reduced-motion toggles.
- **Not in v1:** rest stops or boons, tutorial, leaderboard, homepage link. Music is a stretch goal.

## Files
| path | what |
|---|---|
| `src/1_head.html` | `<head>`, CSS, DOM for HUD and screens |
| `src/2_data.js` | palette, utils, SNACKS, REG (regions), FRIENDS, Taiwan polygon, save |
| `src/2b_zh.js` | Taiwan Mandarin snack and crew descriptions (ZH_SNACK, ZH_FRIEND), by opencode/gpt-6.1-sol |
| `src/2c_i18n.js` | UI strings `STR.en`/`STR.zh`, `T(key, args)`, quips, `applyLang()`. Static DOM text uses `data-i` / `data-ih` attributes |
| `src/3_gfx.js` | sprite cache `spr()`, pixel text, tiny digits, WebAudio `AU`/`SFX` |
| `src/4_world.js` | road geometry (base centerline, forks/branches), region and content generation, props |
| `src/5_update.js` | simulation: player, items, hazards, trucks, storm, abilities, bot |
| `src/6_render.js` | per-pixel ground and road renderer, sprites, signs, storm and Hangry's face |
| `src/6b_fx.js` | ability cut-in (portrait burst at the top center, 0.14 s hit-stop) + per-character screen effects while a power is active (rain dissolves before mid-screen) |
| `src/7_ui.js` | screens, HUD, input, minimap and route map, share, snack log, main loop, boot |
| `art/*.js` | sprites as `SPR.id = ["..k..", ...];` grids. Palette: `art/palette.json` (Endesga-32, one char per color; digits 1-4 are recolor slots) |
| `tools/preview.py` | `python3 tools/preview.py art/X.js 6` renders a PNG sheet and validates the grids |
| `tools/patch_font.py` | adds pinyin tone vowels to Cubic 11 → `font/Cubic_11_tones.ttf` (download the source TTF from github.com/ACh-K/Cubic-11 `fonts/ttf/Cubic_11.ttf`) |
| `tools/build.py` | `python3 tools/build.py` concatenates src + art + the font subset → `games/taiwan-treats-trip/index.html`. **Always edit src/ and rebuild; never edit index.html directly.** |
| `tools/shot.js` | `node tools/shot.js [--veh=scooter --lead=riley --regions=3]`: headless chromium smoke test, screenshots in `shots/`, prints console errors |
| `tools/node_modules` | playwright-core (use `/usr/bin/chromium`) for headless screenshots |

## Status
- [x] Design grilling (2026-10-22)
- [x] Font: Cubic 11 downloaded, tone glyphs patched
- [x] src 1–5 written (not yet run)
- [x] Snack sprites: 42 done (`art/snacks.js`, first pass; the Opus agent died mid-polish)
- [x] Actor sprites: 33 done (`art/actors.js`), including all four car/scooter turning frames; portraits and blue truck polished, sheet visually reviewed
- [x] Prop and landmark sprites (`art/props.js`): 34 done, exact sizes/palette validated; three visual passes and terrain contrast check
- [x] `src/6_render.js`, `src/7_ui.js`, `tools/build.py`, `tools/shot.js`
- [x] First headless run: no console errors; title, play, regions, storm and game over all work (2026-10-22)
- [x] Balance pass: `node tools/sim.js 8 .8 car` → about 230 s and 4 regions on average (target: a typical run is 3–4 min); scooters last longer
- [x] Committed on branch, deployed, live verified with curl (2026-10-22, before props art)
- [x] Redeployed with props, turning frames and polished actors/snacks (2026-10-22). `?debug` shows missing sprites as magenta.
- [x] UI language switch EN/中文 (auto-detected from `navigator.languages[0]`; the choice is saved), About popup (bio, 508.dev hiring note, Why), GPL-3.0-or-later
- [x] Saves are incremental (every 2 s, and on pagehide/hidden), plus a redirect from calebjay.com → www.calebjay.com so localStorage isn't split across origins
- [~] `feat/ability-cutin` branch: anime cut-in + power rain/filters, deployed for Caleb to try (2026-10-22); merge to master if approved
- [ ] Polish: art review, sounds, landmarks, music (stretch)

## Agent log
- 2026-10-22: Opus subagents for art hit the Claude session limit. Art is moving to opencode `openai/gpt-6.1-sol`.
- props.js done by opencode/gpt-6.1-sol: 34 sprites, including 8 landmarks; preview has zero grid errors; weak: theater curves are simplified at 30×22.
- 2026-10-22: opencode/gpt-6.1-sol added four turning frames, sharpened crew portraits and the blue farm truck, and polished 10 snacks (danhuangsu, zhenzhu, xiaolongbao, guabao, zunyu, huasheng, zhutongfan, mashu, zhadan, xiaojuan). Regenerated and visually reviewed actors.png/snacks.png; all 75 grids pass ID, size and palette checks, vehicle recolor slots preserved, JS syntax checks pass.

- 2026-10-22: opencode/gpt-6.1-sol added `src/2b_zh.js`: 36 snack descriptions and 5 pronoun-free friend abilities in playful Taiwan Mandarin. Source unchanged; Node parse/count check prints 36 and 5; snack order, friend IDs, and all snack lengths (≤45 characters) verified.

## Art spec: props (for whoever draws them)
Style: top-down with a 3/4 oblique view (Zelda ALttP / Stardew), light from the top-left, selective outline, Endesga-32 palette chars only. Props sit beside the road on grass, gray city ground, sand or rock.
Ids and sizes (W×H):
- **Vegetation:** tree_round 14×16, tree_pine 12×18, tree_palm 13×18, tree_sakura 14×16, tree_betel 9×20, bamboo 8×18, bush 8×6, flowers 7×5, cabbage 6×5, rice 6×5 (slot 1 = leaf color), boulder 12×10 (white or gray marble)
- **Buildings and street furniture:** roof_a 20×20 and roof_b 20×18 (Taiwanese concrete rooftops seen from above, with a stainless water tank, AC units, a tin add-on in slot 1), tank 8×9, shop 22×16 (generic convenience store, no brand), betelstand 14×14 (neon glass booth), scooterpark 16×10, lantern 5×7, roof_tile 20×16 (dark Jiufen tiles), temple 24×18 (swallowtail ridges), stall 16×14 (awning slot 1), container 8×14 (slot 1), crane 20×30, balloon 14×20 (slots 1 and 2), boat 10×16, guardpost 6×8
- **Landmarks:** lm_101 22×64 (Taipei 101's 8 stacked flared segments plus spire), lm_theater 30×22 (National Taichung Theater: white with organic holes), lm_peak 40×28 (snowy peak), lm_teahouse 28×26 (Jiufen A-Mei teahouse, red lanterns), lm_shrine 28×28 (Eternal Spring Shrine over a waterfall), lm_cliff 36×20 (Qingshui Cliffs into the sea), lm_tree 18×20 (Taitung's lone Mr. Brown Avenue tree in rice paddies), lm_85 26×56 (85 Sky Tower, shaped like 高)
