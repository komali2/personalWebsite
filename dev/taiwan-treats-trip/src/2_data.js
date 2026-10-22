<script>
'use strict';
// one canonical origin, so localStorage (high scores, snack log) is shared
if (location.hostname === 'calebjay.com') location.replace('https://www.calebjay.com' + location.pathname + location.search + location.hash);
/* =========================================================================
   Taiwan Treats Trip 吃飽逃颱: constants, utils, data
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
// darker / much darker palette index for storm shading
const DARK = PAL_RGB.map(([r, g, b], i) => i === 0 ? 0 : nearestPal(r * .55, g * .55, b * .7, i));
const DARK2 = PAL_RGB.map(([r, g, b], i) => DARK[DARK[i]]);

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const ss = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let rnd = Math.random;
const rf = (a, b) => a + (b - a) * rnd();
const ri = (a, b) => Math.floor(a + (b - a + 1) * rnd());
const pick = a => a[Math.floor(rnd() * a.length)];
const chance = p => rnd() < p;
function wpick(obj) { let t = 0; for (const k in obj) t += obj[k]; let r = rnd() * t; for (const k in obj) { r -= obj[k]; if (r <= 0) return k; } return Object.keys(obj)[0]; }
function hash2(x, y) { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) | 0; h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; }
const fmt = n => Math.round(n).toLocaleString('en-US');

/* ------------------------------ snacks ------------------------------ */
// tier: c common, s regional specialty, r rare, g cargo (falls off blue trucks)
const SNACKS = {
  shuijiao: { zh: '水餃', py: 'shuǐjiǎo', en: 'Boiled dumplings', t: 'c', d: 'Pleated pork-and-cabbage pockets. Dip in soy, black vinegar and chili.' },
  chayedan: { zh: '茶葉蛋', py: 'cháyèdàn', en: 'Tea egg', t: 'c', d: 'Stewed in tea and soy by every convenience store register, marbled like old porcelain.' },
  jipai: { zh: '雞排', py: 'jīpái', en: 'Fried chicken cutlet', t: 'c', d: 'Bigger than your face. Pepper salt, chili optional, napkins mandatory.' },
  xiangchang: { zh: '烤香腸', py: 'kǎo xiāngcháng', en: 'Grilled sausage', t: 'c', d: 'Sweet Taiwanese pork sausage, charred on a stick. Eat with a raw garlic clove.' },
  diguaqiu: { zh: '地瓜球', py: 'dìguāqiú', en: 'Sweet potato balls', t: 'c', d: 'Squished while frying until they puff up hollow, crisp and chewy.' },
  congyoubing: { zh: '蔥油餅', py: 'cōngyóubǐng', en: 'Scallion pancake', t: 'c', d: 'Flaky, layered and greasy in the best way. Add an egg.' },
  fenglisu: { zh: '鳳梨酥', py: 'fènglísū', en: 'Pineapple cake', t: 'c', d: 'Buttery shortbread hugging sweet pineapple jam. Souvenir-box royalty.' },
  danhuangsu: { zh: '蛋黃酥', py: 'dànhuángsū', en: 'Egg yolk pastry', t: 'c', d: 'Flaky pastry, red bean paste and a whole salted duck egg yolk.' },
  zhenzhu: { zh: '珍珠奶茶', py: 'zhēnzhū nǎichá', en: 'Bubble milk tea', t: 'r', d: 'Born in Taichung in the 1980s. Chewy tapioca pearls, legendary status. Worth a detour.' },
  xiaolongbao: { zh: '小籠包', py: 'xiǎolóngbāo', en: 'Soup dumplings', t: 's', d: 'Eighteen folds and scalding broth inside. Nibble, slurp, then eat.' },
  guabao: { zh: '刈包', py: 'guàbāo', en: 'Gua bao', t: 's', d: 'Braised pork belly, pickled mustard greens and peanut powder in a folded bun. AKA "tiger bites pig".' },
  hujiaobing: { zh: '胡椒餅', py: 'hújiāobǐng', en: 'Pepper bun', t: 's', d: 'Slapped onto the wall of a clay oven. Peppery pork, scallions, crackly sesame crust.' },
  yansuji: { zh: '鹽酥雞', py: 'yánsūjī', en: 'Popcorn chicken', t: 's', d: 'Night-market fried chicken bites tossed with fried basil, salt and pepper.' },
  taiyangbing: { zh: '太陽餅', py: 'tàiyángbǐng', en: 'Sun cake', t: 's', d: "Taichung's famous flaky pastry with a malt-sugar heart. Crumbs get everywhere." },
  dachang: { zh: '大腸包小腸', py: 'dàcháng bāo xiǎocháng', en: 'Sausage in rice sausage', t: 's', d: 'A grilled pork sausage tucked inside a sticky-rice sausage. The Taiwanese hot dog.' },
  pingguo: { zh: '梨山蘋果', py: 'Líshān píngguǒ', en: 'Lishan apple', t: 's', d: 'Crisp, sweet apples grown in the cold mountain air around Lishan.' },
  shuimitao: { zh: '水蜜桃', py: 'shuǐmìtáo', en: 'Honey peach', t: 's', d: 'High-mountain peaches so juicy you eat them leaning forward.' },
  gaoshancha: { zh: '高山茶', py: 'gāoshānchá', en: 'High-mountain oolong', t: 's', d: 'Tea grown in the clouds. Floral, buttery and very calming before a typhoon.' },
  zunyu: { zh: '烤鱒魚', py: 'kǎo zūnyú', en: 'Grilled trout', t: 's', d: 'Salt-grilled trout from icy mountain streams.' },
  yuyuan: { zh: '芋圓', py: 'yùyuán', en: 'Taro balls', t: 's', d: 'Chewy taro and sweet potato balls over shaved ice or in warm soup.' },
  caozaiguo: { zh: '草仔粿', py: 'cǎozǎiguǒ', en: 'Herbal rice cake', t: 's', d: 'Glutinous rice cake dyed green with cudweed, stuffed with radish and mushroom.' },
  huasheng: { zh: '花生捲冰淇淋', py: 'huāshēng juǎn bīngqílín', en: 'Peanut ice cream roll', t: 's', d: 'Shaved peanut brittle, ice cream and cilantro rolled in a crepe. Trust it.' },
  zhutongfan: { zh: '竹筒飯', py: 'zhútǒngfàn', en: 'Bamboo tube rice', t: 's', d: 'Sticky rice steamed inside bamboo. Crack it open on the trail.' },
  shanzhu: { zh: '山豬香腸', py: 'shānzhū xiāngcháng', en: 'Wild boar sausage', t: 's', d: 'Smoky mountain sausage from the villages around the gorge.' },
  bianshi: { zh: '扁食', py: 'biǎnshí', en: 'Hualien wontons', t: 's', d: 'Plump wontons in clear broth. In Hualien they are biǎnshí, not húntun.' },
  mashu: { zh: '麻糬', py: 'máshǔ', en: 'Mochi', t: 's', d: "Soft pastel rice cakes, dusted and chewy. Hualien's classic souvenir." },
  zhadan: { zh: '炸彈蔥油餅', py: 'zhàdàn cōngyóubǐng', en: 'Bomb scallion pancake', t: 's', d: 'Deep-fried scallion pancake with a whole egg inside. The yolk explodes when you bite.' },
  shijia: { zh: '釋迦', py: 'shìjiā', en: 'Sugar apple', t: 's', d: "Bumpy green fruit named for the Buddha's curls. Custard-sweet inside." },
  biandang: { zh: '池上便當', py: 'Chíshàng biàndāng', en: 'Chishang lunchbox', t: 's', d: 'Famous Chishang rice with braised pork, egg and pickles, packed in a wooden box.' },
  luoshen: { zh: '洛神花', py: 'luòshénhuā', en: 'Roselle', t: 's', d: 'Ruby-red roselle from the Taitung hills, brewed tart or candied sweet.' },
  muguaniunai: { zh: '木瓜牛奶', py: 'mùguā niúnǎi', en: 'Papaya milk', t: 's', d: "Kaohsiung's creamy papaya smoothie. Drink it fast, it does not wait." },
  xiaojuan: { zh: '烤小卷', py: 'kǎo xiǎojuǎn', en: 'Grilled baby squid', t: 's', d: 'Grilled squid on a stick from the Cijin seafood street.' },
  heilun: { zh: '黑輪', py: 'hēilún', en: 'Oden skewer', t: 's', d: 'Fish cake on a stick simmered in sweet broth. The name comes from Taiwanese for oden.' },
  gaolicai: { zh: '高麗菜', py: 'gāolícài', en: 'Mountain cabbage', t: 'g', d: 'Fell off a blue truck. Sweet, crunchy, famous from the high peaks.' },
  xigua: { zh: '西瓜', py: 'xīguā', en: 'Watermelon', t: 'g', d: 'Fell off a blue truck. The road provides.' },
  fengli: { zh: '鳳梨', py: 'fènglí', en: 'Pineapple', t: 'g', d: 'Fell off a blue truck. Ong-lai, the lucky fruit.' },
};
const TIER = { c: { pts: 10, belly: 3.2, chg: 3 }, s: { pts: 30, belly: 5, chg: 5 }, r: { pts: 100, belly: 20, chg: 25 }, g: { pts: 15, belly: 4, chg: 4 } };
const COMMON = Object.keys(SNACKS).filter(k => SNACKS[k].t === 'c');

/* ------------------------------ regions ------------------------------ */
// style ids for the ground renderer
const ST = { city: 0, boulevard: 1, mountain: 2, hilltown: 3, gorge: 4, coast: 5, paddy: 6, harbor: 7 };
const REG = {
  taipei: { en: 'Taipei', zh: '臺北', lon: 121.52, lat: 25.05, next: ['taichung', 'jiufen'], st: ST.city, hw: 30, twist: .15, lanes: 'w',
    spec: ['xiaolongbao', 'guabao', 'hujiaobing', 'yansuji'], haz: { scooters: 2, dog: 1 }, lm: 'lm_101',
    props: [['roof_a', 3, 10, 70], ['roof_b', 3, 10, 70], ['tank', 1, 10, 60], ['shop', 1, 7, 9], ['scooterpark', 1.5, 6, 8], ['tree_round', 2, 4, 6], ['betelstand', .4, 6, 9], ['stall', .8, 6, 9], ['temple', .3, 14, 40]] },
  taichung: { en: 'Taichung', zh: '臺中', lon: 120.68, lat: 24.15, next: ['kaohsiung', 'wuling'], st: ST.boulevard, hw: 32, twist: .2, lanes: 'w',
    spec: ['taiyangbing', 'dachang'], haz: { scooters: 1.5, dog: 1 }, lm: 'lm_theater', rareMul: 3,
    props: [['tree_round', 4, 6, 12], ['roof_a', 2, 18, 70], ['roof_b', 2, 18, 70], ['shop', .8, 14, 16], ['stall', .8, 14, 18], ['betelstand', .6, 14, 18], ['flowers', 1, 5, 12], ['bush', 1, 5, 12]] },
  wuling: { en: 'Wuling Farm', zh: '武陵農場', lon: 121.31, lat: 24.36, next: ['jiufen', 'taroko', 'taitung'], st: ST.mountain, hw: 24, twist: .9, lanes: 'y',
    spec: ['pingguo', 'shuimitao', 'gaoshancha', 'zunyu'], haz: { rock: 2, slide: 1, bus: 1.2, dog: .5 }, lm: 'lm_peak', cargo: 'gaolicai',
    props: [['tree_pine', 5, 4, 60], ['tree_sakura', 1.2, 4, 40], ['bush', 1, 3, 30], ['flowers', .6, 3, 20], ['guardpost', 1.5, 1, 2]] },
  jiufen: { en: 'Jiufen', zh: '九份', lon: 121.84, lat: 25.11, next: ['taipei', 'wuling', 'taroko'], st: ST.hilltown, hw: 24, twist: .65, lanes: 'y',
    spec: ['yuyuan', 'caozaiguo', 'huasheng'], haz: { crowd: 2, dog: 1, scooters: .8 }, lm: 'lm_teahouse',
    props: [['roof_tile', 5, 4, 60], ['temple', .4, 10, 40], ['stall', 1.2, 4, 8], ['tree_round', .8, 4, 30], ['lantern', 0, 0, 0]] },
  taroko: { en: 'Taroko Gorge', zh: '太魯閣', lon: 121.55, lat: 24.17, next: ['wuling', 'hualien'], st: ST.gorge, hw: 23, twist: .85, lanes: 'y',
    spec: ['zhutongfan', 'shanzhu'], haz: { rock: 2, monkey: 2, bus: 1, slide: .6 }, lm: 'lm_shrine',
    props: [['boulder', 3, 3, 60], ['tree_pine', 1.2, 4, 60], ['bamboo', 1, 4, 30], ['guardpost', 1.5, 1, 2]] },
  hualien: { en: 'Hualien', zh: '花蓮', lon: 121.60, lat: 23.98, next: ['taitung', 'jiufen'], st: ST.coast, hw: 27, twist: .45, lanes: 'y',
    spec: ['bianshi', 'mashu', 'zhadan'], haz: { gravel: 2, dog: 1 }, lm: 'lm_cliff', cargo: 'xigua',
    props: [['tree_palm', 2, 4, 40, -1], ['tree_betel', 2, 4, 50, -1], ['bush', 1, 3, 40, -1], ['flowers', 1, 3, 30, -1], ['betelstand', .5, 5, 8, -1], ['boat', .5, 34, 80, 1]] },
  taitung: { en: 'Taitung', zh: '臺東', lon: 121.14, lat: 22.76, next: ['kaohsiung', 'hualien'], st: ST.paddy, hw: 27, twist: .2, lanes: 'y',
    spec: ['shijia', 'biandang', 'luoshen'], haz: { gravel: 1, dog: 1.5 }, lm: 'lm_tree', cargo: 'fengli',
    props: [['tree_betel', 1.5, 3, 60], ['tree_palm', .8, 3, 60], ['flowers', .8, 2, 10], ['balloon', .35, -40, 40]] },
  kaohsiung: { en: 'Kaohsiung', zh: '高雄', lon: 120.30, lat: 22.63, next: ['taichung', 'taitung'], st: ST.harbor, hw: 30, twist: .18, lanes: 'w',
    spec: ['muguaniunai', 'xiaojuan', 'heilun'], haz: { scooters: 2.5, gravel: 1, dog: .6 }, lm: 'lm_85',
    props: [['roof_a', 3, 10, 70, -1], ['roof_b', 2, 10, 70, -1], ['shop', 1, 7, 9, -1], ['scooterpark', 1.5, 6, 8, -1], ['tree_palm', 1.5, 4, 6], ['container', 4, 10, 40, 1], ['crane', .5, 12, 30, 1], ['boat', .6, 46, 90, 1]] },
};
const REGION_LEN = 5600;

/* ------------------------------ friends ------------------------------ */
const FRIENDS = {
  jeremy: { name: 'Jeremy', col: 'e', col2: 'f', ab: 'Drone Scout', zh: '空拍機', desc: 'Drone vacuums up nearby snacks and reveals everything on the next road sign.' },
  riley: { name: 'Riley', col: 'q', col2: 'P', ab: 'Gremlin Hack', zh: '駭客', desc: "Hacks Hangry's firmware. The typhoon glitches, gets knocked back and freezes." },
  caleb: { name: 'Caleb', col: 'k', col2: 'N', ab: 'Too Cool', zh: '太酷了', desc: 'Shades down. Everything goes slow-motion except you.' },
  lauren: { name: 'Lauren', col: 's', col2: 'c', ab: 'Whimsy', zh: '奇想', desc: 'Every hazard on screen turns into snacks. Sparkles included.' },
  rachel: { name: 'Rachel', col: 'R', col2: 'y', ab: 'Kung Fu', zh: '功夫', desc: 'Flying-kick dash. Smash straight through anything in the way.' },
};
const CREW = ['jeremy', 'riley', 'caleb', 'lauren', 'rachel'];

/* Taiwan coastline (lon, lat), clockwise from the northern tip, for the minimap */
const TW_POLY = [[121.51, 25.30], [121.64, 25.22], [121.74, 25.14], [121.92, 25.10], [122.00, 25.01], [121.86, 24.86], [121.83, 24.70], [121.86, 24.58],
  [121.75, 24.33], [121.64, 24.10], [121.62, 23.98], [121.52, 23.70], [121.48, 23.45], [121.38, 23.12], [121.26, 22.92], [121.16, 22.76], [120.98, 22.56],
  [120.90, 22.33], [120.88, 22.10], [120.84, 21.90], [120.74, 21.93], [120.70, 22.08], [120.62, 22.30], [120.47, 22.48], [120.30, 22.58], [120.24, 22.75],
  [120.13, 22.98], [120.10, 23.10], [120.12, 23.40], [120.17, 23.68], [120.25, 23.85], [120.36, 24.05], [120.48, 24.22], [120.62, 24.48], [120.83, 24.72],
  [120.95, 24.85], [121.05, 25.00], [121.20, 25.10], [121.40, 25.18]];

/* ------------------------------ save ------------------------------ */
const SAVE_KEY = 'taiwan-treats-trip-v1';
let save = { best: 0, bests: {}, eaten: {}, runs: 0, mute: false, reduce: null, veh: 'car', lead: 'caleb', lang: null };
try { Object.assign(save, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch (e) { }
if (save.reduce === null) save.reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { } }
// progress is saved as you play (mobile tabs often get closed mid-run, never reaching game over)
let saveDirty = false;
const dirty = () => { saveDirty = true; };
function flushSave() { if (saveDirty) { saveDirty = false; persist(); } }
setInterval(flushSave, 2000);
addEventListener('pagehide', flushSave);
document.addEventListener('visibilitychange', () => { if (document.hidden) flushSave(); });
</script>
