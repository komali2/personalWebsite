<script>
'use strict';
// one canonical origin, so localStorage (best score, stamps, saved run) is shared
if (location.hostname === 'calebjay.com') location.replace('https://www.calebjay.com' + location.pathname + location.search + location.hash);
/* =========================================================================
   Jieyun Jumble 捷運大風吹: palette, utils, save
   ========================================================================= */
const PAL_KEYS = 'knNgGlwrRpsoyYeEfFbBcmMtTuUvPqSz';
const PAL_HEX = ['#181425','#262b44','#3a4466','#5a6988','#8b9bb4','#c0cbdc','#ffffff','#a22633','#e43b44','#ff0044',
  '#f6757a','#f77622','#feae34','#fee761','#63c74d','#3e8948','#265c42','#193c3e','#124e89','#0099db','#2ce8f5',
  '#be4a2f','#d77643','#ead4aa','#e4a672','#b86f50','#733e39','#3e2731','#68386c','#b55088','#e8b796','#c28569'];
const C = {}; PAL_KEYS.split('').forEach((k, i) => C[k] = i);
const PAL_RGB = PAL_HEX.map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
const PAL32 = new Uint32Array(PAL_RGB.map(([r, g, b]) => (255 << 24 | b << 16 | g << 8 | r) >>> 0));
const hexRGB = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgbHex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
const mixHex = (a, b, t) => { const A = hexRGB(a), B = hexRGB(b); return rgbHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const ss = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const easeOut = t => 1 - (1 - clamp(t, 0, 1)) ** 3;
const easeIn = t => clamp(t, 0, 1) ** 2;
// cosmetic randomness (particles, crowd look) never touches the seeded game rng
const mr = Math.random;
const fmt = n => Math.round(n).toLocaleString('en-US');

/* Region fills: tuned so all nine read apart on a phone (the tracks keep the
   official line colors; Danhai's vermilion and Ankeng's khaki would sit too
   close to red/orange/brown as fills, so their areas use sea-aqua and olive). */
const TINT = { BR: '#d6a878', R: '#f5a3b0', G: '#9ed8a0', O: '#f8bb62', BL: '#97c0f2', A: '#c7a9ec', V: '#86ddd5', Y: '#f6e868', K: '#c5cf8e' };
// line-code badge text color (dark on the light lines)
const LINE_INK = { BR: '#fff', R: '#fff', G: '#fff', O: '#181425', BL: '#fff', A: '#fff', V: '#fff', Y: '#181425', K: '#181425' };

/* ------------------------------ save ------------------------------ */
const SAVE_KEY = 'jieyun-jumble-v1';
let save = { best: 0, runs: 0, mute: false, reduce: null, lang: null, auto: false, stamps: {}, found: {}, daily: { date: null, streak: 0, best: 0, last: null }, run: null };
try { Object.assign(save, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch (e) { }
if (save.reduce === null) save.reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { } }
addEventListener('pagehide', () => { if (typeof snapshotRun === 'function') snapshotRun(); persist(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (typeof snapshotRun === 'function') snapshotRun(); persist(); } });
</script>
