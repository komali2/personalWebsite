# Taiwan Battle Bugs 台灣鬥蟲 — progress tracker

Read this first if you are picking the work up (any agent, any provider).

- **License:** GPL-3.0-or-later (`LICENSE`), for code and pixel art. The embedded Cubic 11 font stays OFL-1.1.
- **Ship target:** `games/taiwan-battle-bugs/index.html` (one self-contained file, vanilla Canvas 2D, no CDN). Unlisted on the homepage.
- **Branch:** `feat/taiwan-battle-bugs`. Do not merge or push without asking Caleb. Caleb authorized running `deploy.sh` (FTP mirror to calebjay.com) after the headless smoke test passes, with regular deploys of work in progress: https://www.calebjay.com/games/taiwan-battle-bugs/
- **Dev workspace:** this folder (`dev/` is excluded from deploy). Sister game: `dev/taiwan-treats-trip/` (same pipeline; copy patterns from it).
- **Token budget matters.** Art and text go to opencode with OpenAI models via paseo; Claude writes the code. Update this file after every milestone.

## Settled design (from the /grilling session, 2026-10-23; do not re-litigate)
- **Pitch:** pick a real Taiwanese bug and climb three tea bushes, eating the most delicious leaves, fighting other bugs, leveling up, and beating the tea farmer auntie 阿珠姨 three times. Every bug eats tea leaves even if it really wouldn't; flavor text plays it for laughs.
- **Run:** pick a bug → Bush 1 → farmer → Bush 2 → farmer → Bush 3 → farmer → win screen (the bug wearing her 斗笠 hat, floral 袖套 sleeve covers and six tiny rain boots). Death ends the run (back to bug select). After a win the run ends (endless/hard mode maybe later).
- **Bush:** a climb from the roots to the crown, one fork per step, each step ends with a leaf. The belly holds 8 leaves; a full belly summons the farmer (no grinding). Keep "grazing optional while her patience runs out" possible as a config flag.
- **Leaves:** deliciousness 1–3★ (3★ = the 一心二葉 bud near the crown) drives XP, healing and score. Lore (real): bug-bitten tea leaves taste best (東方美人 Oriental Beauty is made from leafhopper-bitten leaves), so tasty leaves are usually guarded.
- **HP:** carries over between fights in a bush; leaves heal; beating the farmer heals fully.
- **Fork view:** 2–3 branches. Leaf stars are always visible. Most guards show as a silhouette sized by strength (hornet has its own shape); about 1 in 4 guards hides as an ambush. Climb meter (roots → crown) next to the belly meter.
- **Camera:** portrait, over the shoulder. The bottom third is the big back view of your bug (head, thorax, antennae; Pokémon back-sprite style). Above it the stem splits into branches receding into the bush. Swipe/tap a branch → ~0.5 s rush → either eat the leaf or an enemy crawls in ahead facing you. **Battles happen in the same view** (no screen change); ability buttons overlay the bottom.
- **Relative size (camera scales to your bug):** enemies are drawn at their size relative to you (exaggerated, capped). As the leafhopper, a beetle fills the branch; as the beetle, an aphid is a speck. Size also sets how easily the beetle's Intimidate works. The auntie is always ENORMOUS (only part of her face, her arm and the device fit on screen).
- **Combat (ATB-style):** each fighter has one action gauge filled at a rate set by Speed. When full you pick Basic / Special / Super. Special also has its own real-time cooldown. The enemy's gauge and an icon for its next move are visible; big moves wind up longer (telegraph). The gauge doesn't wait. Taps before the gauge is full are queued. No dodge/defend button: defense lives in some specials. Three buttons only.
- **Super:** meter fills from damage dealt and taken (taken fills faster), resets after each fight. Fires instantly, ignoring and not spending the gauge, so it can interrupt a wind-up. Anime cut-in like TTT. Elites and the farmer also have supers; regular bugs don't.
- **Stats:** Attack, Sp. Attack, HP, Speed. Level-up = 1 point; bonus points: +1 for a 3★ leaf, +1 if you fought for it, +2 for an elite guard, +3 per farmer. Each point goes to any stat, with bug-specific growth. Unspent points show as a "+N" badge; a small 4-stat tray appears on the fork screen and never blocks; no spending mid-fight.
- **Roster (playable, all unlocked):**

| id | Bug | Profile | Special | Super | Field trait |
|---|---|---|---|---|---|
| beetle | 獨角仙 Rhinoceros beetle *Trypoxylus dichotomus* | high HP/Atk, slow | Horn Flip: hit + knocks the enemy gauge back 40% | 相撲 Sumo Throw: huge hit + 2 s stun | Intimidate: enemy bugs sometimes freeze in fear for 1.5 s, delaying their first move (60% if much smaller than the beetle, else 30%; not Auntie). Changed 2026-10-23 at Caleb's request: the original "smaller guards flee, free leaf" was far too strong |
| mantis | 寬腹螳螂 Giant Asian mantis *Hierodula patellifera* | high Atk/Spd, fragile | Ambush Stance: 2 s window; the next enemy attack is cancelled and countered hard | 千刀 Thousand Cuts: 6-hit flurry | Camouflage: starts every fight with a full gauge |
| stink | 荔枝椿象 Lychee giant stink bug *Tessaratoma papillosa* | high Sp.Atk, mid HP | Stink Spray: damage over time + enemy gauge 30% slower 5 s | 臭彈 Stink Bomb: enemy can't act 3 s + heavy DoT | Sap Sucker: leaves heal 50% more |
| hopper | 小綠葉蟬 Tea green leafhopper *Jacobiasca formosana* | fastest, low HP/Atk | Hop: dodge the next attack within 2 s + chip + refund half the gauge | 東方美人 Oriental Beauty: big heal + full gauge + Speed up for the fight | Bug-Bitten: every leaf it eats is +1★ |
| spider | 人面蜘蛛 Giant golden orb-weaver *Nephila pilipes* | Sp.Atk/control | Web Shot: hit + enemy gauge 50% slower 5 s | 纏繞 Cocoon Wrap: enemy frozen 4 s + DoT | Web Sense: reveals ambushes and shows which bug each silhouette is |

- **Enemies:** the playable bugs (their kits minus the super) plus tea pests: 茶蚜 tea aphids, 茶角盲椿 tea mosquito bug, 茶毒蛾 tussock caterpillar (stinging hairs), 避債蛾 bagworm in its case, 茶尺蠖 tea looper (inchworm); rare elite 大虎頭蜂 giant hornet (has a super). Regular enemies: basic + one telegraphed special. Enemies scale with bush and climb height; 3★ leaves get tougher guards.
- **Farmer 阿珠姨 Auntie A-Zhu:** 斗笠 conical hat over 花布 floral cloth, floral 袖套, rubber boots, tea basket. HP bar = 耐心 Patience; at 0 she gives up (fanning herself) and you leap to the next bush. Two phases per fight (at 50% she gets angrier: faster gauge, new move, shouted line). Devices: Bush 1 藍白拖 slipper (big telegraphed Smack, fast double-tap); Bush 2 電蚊拍 electric racket (Zap stun resets your gauge, sweep, sparks DoT); Bush 3 噴霧器 backpack sprayer (lingering mist DoT, spray blast; phase 2 the slipper comes back out).
- **Her voice:** full 台語 lines in Han characters (MOE recommended characters) in the bubble, with a smaller subtitle in the UI language (English or Mandarin). No romanization in the bubble; a "what Auntie says" glossary with Tâi-lô goes in the bug log. **Caleb will proofread the 台語.**
- **Bushes:** same tea garden, time of day moves misty dawn → noon → sunset with palette shifts and tougher enemies. Code should allow three different tea regions later (坪林包種, 鹿谷凍頂, 北埔東方美人, riding the blue truck between them).
- **Progression between runs:** a 圖鑑 bug log with real facts (EN/中文) for every species met; a small 斗笠 badge on bugs you've won with; best score; share button. No permanent stat upgrades. A run in progress resumes if the tab is killed.
- **Pace:** ~8 min to win. Regular fights 8–15 s, farmer fights 30–60 s, a leaf-only fork ~2 s. Tune with a headless sim (`tools/sim.js`).
- **Controls:** tap or swipe a branch; desktop arrows (←↑→) pick branches, 1/2/3 fire Basic/Special/Super.
- **Extras (same as TTT):** EN/中文 switch, GoatCounter snippet, About popup, README, mute + reduced-motion toggles, title screen with an attract-mode demo, sound effects only (music is a stretch goal). No tutorial. Fork results are typed events so dialog/augmentation events can be added later.

## Files
| path | what |
|---|---|
| `src/1_head.html` | `<head>`, CSS, DOM for HUD and screens |
| `src/2_data.js` | palette, utils, BUGS, FOES, FARMER, save |
| `src/2b_text.js` | bug log facts, Auntie's 台語 lines, eating quips (content agent) |
| `src/2c_i18n.js` | UI strings `STR.en`/`STR.zh`, `T()`, `applyLang()` |
| `src/3_gfx.js` | sprite cache `spr()`, pixel text, WebAudio `AU`/`SFX` |
| `src/4_world.js` | bush/fork generation, leaves, guards, rewards, leveling |
| `src/5_battle.js` | combat: gauges, moves, effects, enemy AI, farmer |
| `src/5b_flow.js` | run state machine (fork → rush → arrive → fight → eat), bot |
| `src/6_render.js` | scene renderer: sky, bush, branches, leaves, bugs, farmer |
| `src/6b_fx.js` | particles, damage numbers, cut-in |
| `src/7_ui.js` | screens, HUD, input, select, log, share, main loop, boot |
| `art/*.js` | sprites as `SPR.id = ["..k..", ...];` grids. Palette: `art/palette.json` (Endesga-32, one char per color) |
| `tools/build.py` | `python3 tools/build.py` → `games/taiwan-battle-bugs/index.html`. Edit src/ and rebuild; never edit index.html |
| `tools/preview.py` | `python3 tools/preview.py art/X.js 6` renders a PNG sheet and validates grids |
| `tools/shot.js`, `tools/sim.js` | headless chromium smoke test + screenshots; balance sim |

## Status
- [x] Design grilling (2026-10-23)
- [x] Workspace + tools copied from TTT
- [x] Art: bugs (`art/bugs.js`), foes + auntie (`art/foes.js`), scene + icons (`art/scene.js`); one polish pass each
- [x] Text: `src/2b_text.js` (Auntie's 台語 lines await Caleb's proofreading, table at the end)
- [x] Code: src 1–7, build, headless smoke test (`node tools/shot.js`: every phase, no console errors)
- [x] Balance sim, first pass (`node tools/sim.js 16 all`): bot win rate beetle 50%, mantis 44%, stink 50%, hopper 38%, spider 31%; regular fights 6–11 s; Auntie fights 20–60 s; bot win runs ~4–5 min (humans are slower at forks and stat picks)
- [x] Deployed 2026-10-23; live page byte-identical to the build, smoke test passes against the live URL
- [ ] Next: Caleb plays it on a phone; tune feel (fork readability, button feel, Auntie difficulty); maybe BELLY 9–10 if runs feel short; music (stretch); later events (dialog, augmentations), tea regions

## Balance knobs
`FARM` (Auntie hp/atk/spd per bush), `FOE_HP` and `FOE_K` (enemy scaling), `BUGS.*.base/grow`, `BELLY`, `xpNeed()` in 4_world.js, guard odds and `foePower()` in 4_world.js, move multipliers in `MOVES` (5_battle.js). Elites never hide (an unavoidable hornet ambush was unfair).

## Agent log
- 2026-10-23: Created art/foes.js and foes.png: all 14 enumerated enemy/Auntie/device sprites (spec heading says 15), exact sizes and palette, matching Auntie framing; two visual review passes and zero validation errors; mirid mouthparts and racket mesh remain delicate at small scales.
- 2026-10-23: Created art/scene.js and scene.png: all 19 tea-leaf, flower, and UI sprites; two visual review passes at 8×, preview zero errors, exact dimensions and palette-only/no-digit validation passed.
- 2026-10-23: workspace created; art and text dispatched to opencode/openai/gpt-6.1-sol via paseo.
- 2026-10-23: Created `src/2b_text.js`: 12 verified bug-log entries, 18 Auntie lines with Tâi-lô, and 15 eating quips; proofreading table appended below. The specified Auntie keys total 16, so optional `win2`/`win3` preserve all required keys while meeting the requested 18-entry count. Node validation returned `12 18 5`; schemas, character limits, script wrapper, and all proofreading rows passed.
- 2026-10-23: Created art/bugs.js and bugs.png: all 15 hero sprites (64×44 cropped backs, 48×40 fronts, 48×48 farmer outfits), exact dimensions/palette/no digits and solid bottom crops verified with zero errors; four preview reviews plus gameplay-scale review; fine antennae and floral details simplify at tiny enemy scales, and the spider correctly retains eight legs/boots.
- 2026-10-23: Polished bk_beetle with near-black glossy shell, three crisp reflection groups and horn edge light; redrew fr_spider with dominant forward-facing eyes/fangs and recessed abdomen, and matched win_spider with hat above the eyes; other 12 grids unchanged, two preview reviews plus gameplay-scale review, zero validation errors.

---

## Art spec (for whoever draws)
**Format:** each sprite is `SPR.<id> = [ "row", "row", ... ];` in the named file, one character per pixel, `.` = transparent, every row exactly the stated width, exactly the stated height. Only palette keys from `art/palette.json` (`k n N g G l w r R p s o y Y e E f F b B c m M t T u U v P q S z`); no digits. Validate with `python3 tools/preview.py art/<file>.js 6` (zero errors) and look at the PNG.
**Style:** same as `dev/taiwan-treats-trip/art/*.js`: Endesga-32, light from the top-left, selective outline (mostly `k` black-purple, or a darker shade of the local color), 2–4 shades per material, crisp readable silhouettes, no dithering noise. The game renders on a ~168 px wide low-res canvas, scaled up. Bugs should look like the real species (check reference photos in your head: colors, body plan, distinctive parts) but cute-chunky and readable, with expressive eyes where the species allows. No text in sprites.

### `art/bugs.js` — the five playable bugs (15 sprites)
**Back views, 64×44** (the player's bug, drawn at 2× at the bottom of the screen). Seen from behind and a little above, head facing away from us (toward the top of the sprite), as if the camera sits just behind the bug's shoulders. Show the head, thorax and the start of the abdomen/wings; the body is **cut off by the bottom edge** (bottom rows are fully filled body, as if it continues off-screen). Antennae / horn / raised forelegs reach up toward the top. Centered horizontally. Leave the top few rows mostly transparent except for antennae/horn tips.
- `bk_beetle`: 獨角仙 male rhinoceros beetle. Glossy very dark reddish-brown to black (`v U u` with `z`/`w` specular glints), big forked head horn curving up and forward (pointing up the sprite), small forked thoracic horn on the pronotum, elytra at the bottom with a center seam, spiky front legs splaying out sideways.
- `bk_mantis`: 寬腹螳螂 giant Asian mantis, bright green (`e E f`, `Y` highlights). Triangular head with big compound eyes bulging at the sides, thin antennae, both raptorial forelegs raised up and forward (spiny, folded, "boxing"), long prothorax running down, folded green wing covers at the bottom with a small white spot on each (real field mark).
- `bk_stink`: 荔枝椿象 lychee giant stink bug, broad shield shape. Ochre/orange-brown (`M u T`, `t` highlight, `U` shade), small head with antennae at the top, wide shoulders, scutellum triangle in the middle, wing membrane edge at the bottom, short legs out to the sides.
- `bk_hopper`: 小綠葉蟬 tea green leafhopper, a tiny wedge-shaped bug. Pale lime green (`e`, `Y`, with `E` shading, a hint of `c`/`w` on translucent wings), rounded crown, short bristle antennae, big eyes on the sides, wings folded like a roof down the middle, spiny hind legs poking out to the sides.
- `bk_spider`: 人面蜘蛛 giant golden orb-weaver seen from behind: the big elongated abdomen fills the bottom (pale yellow-cream `t`/`T` with dark `k`/`v` markings and a few `S`/`R` spots), the cephalothorax beyond it, eight long legs with yellow-and-black bands (`Y y` and `k`) arching out to both sides and forward; the front legs reach up past the head.

**Front views, 48×40** (rendered at 0.35×–3.2× as enemies, on the select screen and in the super cut-in). Facing the camera head-on, slightly from above, like a Pokémon front sprite but looking at the viewer, a little menacing. Centered; feet/body rest on the bottom 1–2 rows. Ids: `fr_beetle`, `fr_mantis` (raptorial arms up and open), `fr_stink`, `fr_hopper`, `fr_spider`. Same colors as the back views.

**Win views, 48×48**: the same five bugs in the same front pose as `fr_*` (redraw, consistent with them) dressed as the tea farmer: a wide 斗笠 conical bamboo hat (`t T u`, dark rim), floral pink-red 袖套 sleeve covers on the front legs (`q s R` flowers on `b` or `f`), and tiny rubber rain boots on the feet (white `w l` or navy `b`). Proud pose. Ids: `win_beetle`, `win_mantis`, `win_stink`, `win_hopper`, `win_spider`.

### `art/foes.js` — enemies and the auntie (15 sprites)
**Enemy front views, 48×40**, same convention as `fr_*` above:
- `fr_aphid`: 茶蚜 a clump of 4–5 tea aphids (small, pear-shaped, dark brown/black `v U k` with `G` highlights, little tail tubes), one larger aphid in front.
- `fr_mirid`: 茶角盲椿 tea mosquito bug (Helopeltis): slender, long thin legs and very long antennae, orange-red thorax (`R o`) with black, a tall thin pin-like horn sticking up from its back, long needle mouthparts.
- `fr_tussock`: 茶毒蛾 tea tussock moth caterpillar: yellow-ochre (`y T`) caterpillar rearing up facing us, tufts of stinging hairs (`t Y`) and black/brown spots, small dark head.
- `fr_bagworm`: 避債蛾 bagworm: a spindle-shaped case covered in bits of twig and leaf (`u U E f`), hanging/standing upright, the caterpillar's black-and-cream head and front legs poking out the top.
- `fr_looper`: 茶尺蠖 tea looper inchworm: a twig-brown (`u U z`) inchworm arched into a tall Ω loop, head end raised looking at us.
- `fr_hornet`: 大虎頭蜂 giant hornet, elite boss bug: large orange-yellow head (`y o`) with big dark mandibles and dark eyes, dark brown thorax, black and yellow-orange striped abdomen, wings spread (`l w` translucent with `G`), clearly the scariest.

**Auntie 阿珠姨**, drawn at 3–4.5× (bold shapes, few details): Taiwanese tea-farmer auntie, 50s–60s.
- `au_face` 56×48: her head looking down at us, filling the frame. A wide 斗笠 conical bamboo hat on top spanning the full width (rows ~0–15, woven texture `t T u`, dark rim `U`), under it a floral-print 花布 cloth (pink/red flowers `q s R` on deep blue `b` or green `f`) covering her hair, cheeks and neck, tied under the chin; her face in the opening (`S z T` skin, `U` shade), determined narrow eyes, a little permed fringe, mouth in a tight frown. Bottom rows: shoulders in the cloth.
- `au_mad` 56×48: same framing, angry: brows down, eyes glaring, mouth wide open shouting, an anger vein mark, sweat.
- `au_tired` 56×48: same framing, defeated: eyes closed in arcs, big sweat drops, mouth sighing, slightly tilted.
- `au_arm` 24×44: a forearm rising from the bottom edge, in a floral 袖套 sleeve cover (gathered at both ends), bare hand at the top in a gripping fist.
- `dv_slipper` 20×40: 藍白拖 blue-and-white slipper, sole side toward us, white footbed (`w l G`) with the blue strap (`B b`), worn heel.
- `dv_racket` 28×56: 電蚊拍 electric mosquito racket: yellow-orange plastic oval frame (`y o`) with a silver mesh grid (`l G`), handle at the bottom with a red button.
- `dv_spray` 40×24: a pesticide sprayer wand pointing left: metal lance (`G l`), nozzle at the left end, trigger grip on the right, a bit of black hose.
- `au_fan` 16×16: a round hand fan (red `R r` with a pale `t` pattern).

### `art/scene.js` — leaves and icons (19 sprites)
- `lf1` 20×14: mature tea leaf, dark glossy green (`f E`, `e` highlight), elliptical, serrated edge, visible midrib and veins, pointing up-right.
- `lf2` 18×14: young leaf, brighter green (`E e`, `Y` highlight).
- `lf3` 18×22: 一心二葉 "one bud, two leaves": a slim silvery-downy bud (`l w e`) on top and two tender light-green leaves (`e Y E`) below, on a short stem.
- `flower` 8×8: tea flower, white petals (`w l`), yellow center (`Y y`).
- Icons, readable at 1× (outline `k`): `ic_atk` 12×12 (red claw/fang `R`), `ic_spa` 12×12 (purple-cyan swirl/burst `q c`), `ic_hp` 12×12 (heart `R`), `ic_spd` 12×12 (wing or lightning `Y`), `ic_star` 7×7 (yellow star `Y y`), `ic_leaf` 9×9 (`e E`), `ic_super` 12×12 (orange flame burst `o y Y`), `ic_sound` 12×12, `ic_mute` 12×12, `ic_pause` 12×12, `ic_douli` 14×9 (tiny conical bamboo hat badge), `ic_ko` 9×9 (X eyes / swirl), `ic_fist` 9×9 (basic-attack telegraph), `ic_bang` 9×9 (red `!` special telegraph), `ic_bug` 12×12 (generic cute bug, for the bug-log button).

## Text spec (`src/2b_text.js`)
Plain JS, no exports, defines exactly these globals:
```js
const LOG = { <id>: { sci, en, zh, size_en, size_zh, fact_en, fact_zh }, ... };   // ids below
const AUNT = { <key>: { tw, tl, en, zh }, ... };   // tw = 台語 in Han characters (MOE 教育部推薦用字), tl = Tâi-lô, en = English subtitle, zh = Mandarin subtitle
const EAT = { <bug id>: [ { en, zh }, { en, zh }, { en, zh } ], ... };   // quips when the bug eats a tea leaf
```
- LOG ids: `beetle hopper mantis stink spider aphid mirid tussock bagworm looper hornet aunt`. Facts: 1–2 true, fun sentences (≤ 160 chars EN), Taiwan-specific where possible; `aunt` describes Taiwanese tea-farming aunties (斗笠, 袖套, slippers, electric rackets). Verify species names; size like "50–80 mm".
- AUNT keys: `intro1 intro2 intro3` (she shows up at bush 1/2/3 with the slipper / racket / sprayer), `half1 half2 half3` (phase 2 at half patience), `super1 super2 super3` (her super move shout), `hit1 hit2 hit3` (short reactions when hit), `win` (she squashes you), `lose1 lose2 lose3` (she gives up, fanning herself; grudging). Short (≤ 14 Han characters for `tw`), funny, auntie-like, not cruel.
- EAT: ids `beetle mantis stink hopper spider`, 3 quips each, ≤ 70 chars EN; joke that most of them don't eat tea leaves (mantis and spider are predators, beetle adults drink sap, stink bug sucks lychee/longan sap; the leafhopper actually does feed on tea, smugly). No pronouns for the bug except "it"; Taiwan Mandarin for zh (臺灣用語).

## Auntie lines for proofreading

Original dialogue using MOE-recommended characters and citation-tone Tâi-lô (`--` marks neutral-tone attachment). 台語 uses 蠓; Mandarin subtitles use 蚊. The requested key list has 16 entries, so `win2` and `win3` are optional racket/sprayer victory variants to reach the requested 18. Caleb: please proofread wording, readings, and auntie flavor.

key | 台語 | Tâi-lô | English
--- | --- | --- | ---
intro1 | 藍白拖來矣！ | Nâ-pe̍h-thua lâi--ah! | Here comes the blue-and-white slipper!
intro2 | 電蠓拍咧等你！ | Tiān-báng-phah teh tán lí! | The electric racket is waiting for you!
intro3 | 噴霧器準備好矣！ | Phùn-bū-khì tsún-pī hó--ah! | Sprayer ready. Auntie means business!
half1 | 閣食？毋免錢喔！ | Koh tsia̍h? M̄ bián tsînn--ooh! | Still eating? This is not a free buffet!
half2 | 袂驚電？有夠勇！ | Bē kiann tiān? Ū-kàu ióng! | Not scared of a zap? Brave little thing!
half3 | 藍白拖閣出場！ | Nâ-pe̍h-thua koh tshut-tiûnn! | The slipper is back for an encore!
super1 | 看我的藍白拖！ | Khuànn guá ê nâ-pe̍h-thua! | Behold! The mighty blue-and-white slipper!
super2 | 電予你跳舞！ | Tiān hōo lí thiàu-bú! | One zap and you will be dancing!
super3 | 予你洗身軀！ | Hōo lí sé-sin-khu! | Bath time, little leaf thief!
hit1 | 哎喲喂，誠有力！ | Ai--iō-uê, tsiânn ū-la̍t! | Aiyo! That little thing packs a punch!
hit2 | 我的花衫啦！ | Guá ê hue-sann--lah! | Not the floral shirt!
hit3 | 夭壽，真會閃！ | Iáu-siū, tsin ē siám! | Good grief! What a little dodger!
win | 食飽就轉去！ | Tsia̍h-pá tō tńg--khì! | Full belly? Home you go!
win2 | 電蠓拍收工！ | Tiān-báng-phah siu-kang! | Electric racket: off duty!
win3 | 茶樹會當歇睏矣！ | Tê-tshiū ē-tàng hioh-khùn--ah! | The tea bushes can finally rest!
lose1 | 好啦，予你食！ | Hó--lah, hōo lí tsia̍h! | Fine, fine. Have your snack!
lose2 | 歇睏，啉茶較贏！ | Hioh-khùn, lim tê khah iânn! | Break time. A cup of tea beats this!
lose3 | 笠仔予你，免閣來！ | Le̍h-á hōo lí, bián koh lâi! | Take the hat. No rematch!
