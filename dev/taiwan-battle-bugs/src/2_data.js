<script>
'use strict';
// one canonical origin, so localStorage (best score, bug log, saved run) is shared
if (location.hostname === 'calebjay.com') location.replace('https://www.calebjay.com' + location.pathname + location.search + location.hash);
/* =========================================================================
   Taiwan Battle Bugs 台灣鬥蟲: constants, utils, data
   ========================================================================= */
const PAL_KEYS = 'knNgGlwrRpsoyYeEfFbBcmMtTuUvPqSz';
const PAL_HEX = ['#181425','#262b44','#3a4466','#5a6988','#8b9bb4','#c0cbdc','#ffffff','#a22633','#e43b44','#ff0044',
  '#f6757a','#f77622','#feae34','#fee761','#63c74d','#3e8948','#265c42','#193c3e','#124e89','#0099db','#2ce8f5',
  '#be4a2f','#d77643','#ead4aa','#e4a672','#b86f50','#733e39','#3e2731','#68386c','#b55088','#e8b796','#c28569'];
const C = {}; PAL_KEYS.split('').forEach((k, i) => C[k] = i);
const PAL_RGB = PAL_HEX.map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
const PAL32 = new Uint32Array(PAL_RGB.map(([r, g, b]) => (255 << 24 | b << 16 | g << 8 | r) >>> 0));
function nearestPal(r, g, b, not) {
  let best = 0, bd = 1e9;
  PAL_RGB.forEach(([R, G, B], i) => { if (i === not) return; const d = (R - r) ** 2 * 3 + (G - g) ** 2 * 4 + (B - b) ** 2 * 2; if (d < bd) { bd = d; best = i; } });
  return best;
}
// darker palette index, for foliage depth
const DARK = PAL_RGB.map(([r, g, b], i) => i === 0 ? 0 : nearestPal(r * .55, g * .55, b * .7, i));

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const ss = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const easeOut = t => 1 - (1 - clamp(t, 0, 1)) ** 3;
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let rnd = Math.random;
const rf = (a, b) => a + (b - a) * rnd();
const ri = (a, b) => Math.floor(a + (b - a + 1) * rnd());
const pick = a => a[Math.floor(rnd() * a.length)];
const chance = p => rnd() < p;
function wpick(obj) { let t = 0; for (const k in obj) t += obj[k]; let r = rnd() * t; for (const k in obj) { r -= obj[k]; if (r <= 0) return k; } return Object.keys(obj)[0]; }
// cosmetic randomness (particles, shake) never touches the seeded game rng
const mr = Math.random;
const fmt = n => Math.round(n).toLocaleString('en-US');
const STATS = ['atk', 'spa', 'hp', 'spd'];

/* ------------------------------ playable bugs ------------------------------
   size: rough log-scale body size, drives on-screen scale and how easily the beetle's Intimidate works.
   base: level-1 stats. grow: what one stat point adds. pref: the bot's (and demo's) build. */
const BUGS = {
  beetle: { en: 'Rhino Beetle', zh: '獨角仙', sci: 'Trypoxylus dichotomus', size: 4.5, col: 'v', col2: 'y',
    base: { hp: 70, atk: 10, spa: 8, spd: 7 }, grow: { hp: 10, atk: 2.2, spa: 1.6, spd: 1 },
    basic: { en: 'Shove', zh: '頂撞' },
    sp: { id: 'hornflip', cd: 6, en: 'Horn Flip', zh: '挑角', d: 'Hit and knock the enemy gauge back 40%.', dz: '攻擊並把對手的行動條打退 40%。' },
    su: { id: 'sumo', en: 'Sumo Throw', zh: '相撲', d: 'Huge hit and a 2 s stun.', dz: '超大傷害，再暈眩 2 秒。' },
    tr: { en: 'Intimidate', zh: '威嚇', d: 'Enemy bugs sometimes freeze in fear, delaying their first move (smaller ones more often).', dz: '敵方的蟲有時會被嚇呆，第一招延後出手（越小隻越容易）。' },
    pref: ['atk', 'hp', 'atk', 'spd', 'hp', 'spa'] },
  mantis: { en: 'Giant Asian Mantis', zh: '寬腹螳螂', sci: 'Hierodula patellifera', size: 4.4, col: 'e', col2: 'Y',
    base: { hp: 38, atk: 11, spa: 9, spd: 12 }, grow: { hp: 6, atk: 2.5, spa: 2, spd: 1.4 },
    basic: { en: 'Slash', zh: '揮砍' },
    sp: { id: 'stance', cd: 5, en: 'Ambush Stance', zh: '伏擊架勢', d: 'For 2 s, the next attack is cancelled and countered hard.', dz: '2 秒內，對手下一招會被擋下並重重反擊。' },
    su: { id: 'cuts', en: 'Thousand Cuts', zh: '千刀', d: 'A 6-hit flurry.', dz: '連續 6 刀亂舞。' },
    tr: { en: 'Camouflage', zh: '偽裝', d: 'Starts every fight with a full gauge.', dz: '每場戰鬥開場行動條就是滿的。' },
    pref: ['atk', 'spd', 'hp', 'atk', 'spa', 'hp'] },
  stink: { en: 'Lychee Stink Bug', zh: '荔枝椿象', sci: 'Tessaratoma papillosa', size: 3.4, col: 'M', col2: 'Y',
    base: { hp: 52, atk: 6, spa: 11, spd: 8 }, grow: { hp: 8, atk: 1.2, spa: 2.5, spd: 1.1 },
    basic: { en: 'Poke', zh: '戳刺' },
    sp: { id: 'spray', cd: 6, en: 'Stink Spray', zh: '臭液噴射', d: 'Damage over time, and the enemy gauge fills 30% slower for 5 s.', dz: '持續傷害，對手行動條 5 秒內慢 30%。' },
    su: { id: 'bomb', en: 'Stink Bomb', zh: '臭彈', d: "Enemy can't act for 3 s, plus heavy damage over time.", dz: '對手 3 秒不能動，再加重度持續傷害。' },
    tr: { en: 'Sap Sucker', zh: '吸汁專家', d: 'Leaves heal 50% more.', dz: '吃葉子回血多 50%。' },
    pref: ['spa', 'hp', 'spa', 'spd', 'hp', 'atk'] },
  hopper: { en: 'Tea Leafhopper', zh: '小綠葉蟬', sci: 'Jacobiasca formosana', size: 1.2, col: 'e', col2: 'c',
    base: { hp: 34, atk: 7, spa: 8, spd: 17 }, grow: { hp: 6, atk: 1.6, spa: 1.8, spd: 2.2 },
    basic: { en: 'Nibble', zh: '咬一口' },
    sp: { id: 'hop', cd: 4.5, en: 'Hop', zh: '彈跳', d: 'Dodge the next attack within 2 s, chip damage, refund half the gauge.', dz: '2 秒內閃過下一招，順便小咬一口，退回一半行動條。' },
    su: { id: 'beauty', en: 'Oriental Beauty', zh: '東方美人', d: 'Big heal, full gauge, and more Speed for the rest of the fight.', dz: '大量回血、行動條全滿，本場速度提升。' },
    tr: { en: 'Bug-Bitten', zh: '著涎', d: 'Every leaf it eats is +1★.', dz: '吃過的每片葉子都多 1 顆星。' },
    pref: ['spd', 'atk', 'hp', 'spa', 'spd', 'hp'] },
  spider: { en: 'Golden Orb-Weaver', zh: '人面蜘蛛', sci: 'Nephila pilipes', size: 4.6, col: 'Y', col2: 'k',
    base: { hp: 52, atk: 9, spa: 12, spd: 10 }, grow: { hp: 7.5, atk: 1.8, spa: 2.4, spd: 1.4 },
    basic: { en: 'Bite', zh: '咬' },
    sp: { id: 'web', cd: 6, en: 'Web Shot', zh: '蛛網', d: 'Hit, and the enemy gauge fills 50% slower for 5 s.', dz: '攻擊並讓對手行動條 5 秒內慢 50%。' },
    su: { id: 'cocoon', en: 'Cocoon Wrap', zh: '纏繞', d: 'Enemy frozen for 4 s, plus damage over time.', dz: '對手被包住 4 秒，再加持續傷害。' },
    tr: { en: 'Web Sense', zh: '網感', d: 'Sees ambushes and who is guarding each leaf.', dz: '看得到埋伏，也知道每片葉子是誰在守。' },
    pref: ['spa', 'atk', 'hp', 'spa', 'spd', 'hp'] },
};
const BUG_IDS = ['beetle', 'mantis', 'stink', 'hopper', 'spider'];

/* ------------------------------ enemies ------------------------------
   w: spawn weight per bush. Playable bugs also appear as enemies (their special, no super). */
const FOES = {
  aphid: { en: 'Tea Aphids', zh: '茶蚜', size: 1, base: { hp: 30, atk: 4, spa: 4, spd: 11 }, w: [3, 2, 1],
    sp: { id: 'swarm', cd: 5, en: 'Swarm', zh: '群起圍攻' } },
  mirid: { en: 'Tea Mosquito Bug', zh: '茶角盲椿', size: 1.9, base: { hp: 34, atk: 5, spa: 5, spd: 10 }, w: [2.5, 2, 1.5],
    sp: { id: 'toxic', cd: 6, en: 'Toxic Saliva', zh: '毒唾液' } },
  tussock: { en: 'Tussock Caterpillar', zh: '茶毒蛾幼蟲', size: 2.5, base: { hp: 40, atk: 5, spa: 5, spd: 8 }, w: [1.5, 2, 2],
    sp: { id: 'hairs', cd: 6, en: 'Itchy Hairs', zh: '毒毛' } },
  looper: { en: 'Tea Looper', zh: '茶尺蠖', size: 2.9, base: { hp: 44, atk: 6, spa: 4, spd: 7 }, w: [1.5, 2, 2],
    sp: { id: 'whip', cd: 5, en: 'Loop Whip', zh: '一拱一抽' } },
  bagworm: { en: 'Bagworm', zh: '避債蛾', size: 3.4, base: { hp: 52, atk: 5, spa: 5, spd: 6 }, w: [1, 1.5, 2],
    sp: { id: 'hide', cd: 7, en: 'Hide in Case', zh: '躲進袋巢' } },
  hornet: { en: 'Giant Hornet', zh: '大虎頭蜂', size: 4.6, elite: true, base: { hp: 96, atk: 9, spa: 8, spd: 10 }, w: [0, 0, 0],
    sp: { id: 'crush', cd: 5, en: 'Mandible Crush', zh: '大顎咬碎' }, su: { id: 'venom', en: 'Venom Sting', zh: '毒針' } },
};
const FOE_IDS = ['aphid', 'mirid', 'tussock', 'looper', 'bagworm', 'hornet'];
const BUG_AS_FOE_W = [.5, 1, 1.4];
// enemy stat scaling per "power point" E (roughly the stat points the player should have by then)
const FOE_HP = 1.2; // global enemy HP knob
const FOE_K = { hp: .06, atk: .045, spa: .045, spd: .012 };

/* ------------------------------ the farmer ------------------------------ */
const FARM = [
  { dev: 'dv_slipper', hp: 420, atk: 3.1, spd: 6, p1: { smack: 2, double: 2 }, p2: { smack: 2, double: 1, toss: 2 }, su: 'barrage',
    en: 'Slipper', zh: '藍白拖' },
  { dev: 'dv_racket', hp: 780, atk: 5.1, spd: 7, p1: { zap: 2, sweep: 2, sparks: 1 }, p2: { zap: 2, sweep: 1, sparks: 1, overcharge: 2 }, su: 'megazap',
    en: 'Electric racket', zh: '電蚊拍' },
  { dev: 'dv_spray', hp: 1200, atk: 6.6, spd: 8, p1: { mist: 2, blast: 2 }, p2: { mist: 1, blast: 2, smack: 2 }, su: 'fullspray',
    en: 'Sprayer', zh: '噴霧器' },
];
const BUSH_TOD = [{ en: 'Dawn', zh: '清晨' }, { en: 'Noon', zh: '正午' }, { en: 'Sunset', zh: '黃昏' }];
const BELLY = 8;            // leaves per bush; a full belly summons Auntie
const GRAZE_AFTER_FULL = false; // design option: keep grazing while her patience runs out (not built yet)

/* ------------------------------ save ------------------------------ */
const SAVE_KEY = 'taiwan-battle-bugs-v1';
let save = { best: 0, wins: {}, seen: {}, heard: {}, runs: 0, mute: false, reduce: null, lang: null, bug: 'beetle', run: null };
try { Object.assign(save, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch (e) { }
if (save.reduce === null) save.reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { } }
addEventListener('pagehide', () => { if (typeof snapshotRun === 'function') snapshotRun(); persist(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (typeof snapshotRun === 'function') snapshotRun(); persist(); } });
</script>
