// Headless generator sim on the real layouts (no browser).
// usage: node tools/gen_sim.js [days=20] [--show] [--seed=N]
// Plays the board chain of a service day: 2 boards per size from 5x5 to 8x8, then 9x9 until `perDay` boards.
// Reports generator tries/time, difficulty levels, regulars, and how much the map reshuffles.
const core = require('./core');
const arg = (k, d) => { const a = process.argv.find(s => s.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const days = +(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 20), show = process.argv.includes('--show');
const perDay = +arg('boards', 14);
const L = {}; for (const n of [5, 6, 7, 8, 9]) L[n] = core.prepLayout(core.parseLayout(n));
const WANT = core.WANT || {
  5: { lvMin: 0, lvMax: 1 }, 6: { lvMin: 1, lvMax: 2 }, 7: { lvMin: 1, lvMax: 3 }, 8: { lvMin: 2, lvMax: 3 }, 9: { lvMin: 2, lvMax: 4 } };
function draw(b) {
  const n = b.n, ch = 'ABCDEFGHI', rows = [];
  for (let y = 0; y < n; y++) {
    let s = '';
    for (let x = 0; x < n; x++) {
      const c = y * n + x, l = b.reg[c], train = b.pos.findIndex((p, i) => b.lay.tracks[i][p] === c) >= 0;
      const q = b.givens.includes(c) ? '#' : b.sol.includes(c) ? '*' : train ? '@' : ' ';
      s += b.lay.ids[l].padEnd(2) + q + ' ';
    }
    rows.push(s);
  }
  return rows.join('\n');
}
const stat = {};
const t0 = Date.now();
for (let d = 0; d < days; d++) {
  const rnd = core.rng32(+arg('seed', 1) * 1000 + d);
  let prev = null;
  for (let k = 0; k < perDay; k++) {
    const n = Math.min(9, 5 + (k >> 1)), lay = L[n];
    const t = Date.now();
    let b = core.genBoard(lay, prev, Object.assign({ extra: 0 }, WANT[n]), rnd);
    let fb = 0;
    if (!b && prev && prev.lay === lay) { fb = 1; b = core.genBoard(lay, prev, Object.assign({ extra: 2 }, WANT[n]), rnd); }
    if (!b) { fb = 2; b = core.genBoard(lay, null, WANT[n], rnd); }
    const ms = Date.now() - t;
    const s = stat[n] || (stat[n] = { boards: 0, ms: [], tries: [], lv: [0, 0, 0, 0, 0], giv: [], mv: [], fb: [0, 0, 0], steps: [] });
    if (!b) { console.log('FAILED', n); break; }
    s.boards++; s.ms.push(ms); s.tries.push(b.tries); s.lv[b.lv]++; s.giv.push(b.givens.length); s.fb[fb]++; s.steps.push(b.steps);
    if (prev && prev.lay === lay) s.mv.push(core.moved(prev.reg, b.reg));
    if (show && d === 0) console.log(`\nboard ${k} ${n}x${n} lv${b.lv} steps ${b.steps} givens ${b.givens.length} tries ${b.tries} ${ms}ms fb${fb}\n` + draw(b));
    prev = b;
  }
}
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0, mx = a => a.length ? Math.max(...a) : 0;
for (const n in stat) {
  const s = stat[n];
  console.log(`${n}x${n} boards ${s.boards}  ms avg ${avg(s.ms).toFixed(0)} max ${mx(s.ms)}  tries avg ${avg(s.tries).toFixed(0)}  lv ${JSON.stringify(s.lv)}  steps ${avg(s.steps).toFixed(1)}  givens ${avg(s.giv).toFixed(2)} [${Math.min(...s.giv)}-${mx(s.giv)}]  moved ${avg(s.mv).toFixed(2)}  fallback ${JSON.stringify(s.fb)}`);
}
console.log(`total ${((Date.now() - t0) / 1000).toFixed(1)}s`);
