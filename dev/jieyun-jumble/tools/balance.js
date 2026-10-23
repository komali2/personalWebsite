// Day balance sim (no browser): simulated players of different speeds play seeded days.
// usage: node tools/balance.js [days=40]
// A player needs sec/cell × n² × (1 + 0.15 × logic level) + 2 s per board, ±30% noise, and takes a hint
// on boards that run past 2.2× their usual time. Targets (PROGRESS.md): average players usually see
// the last train with a tense evening rush; fast players clear the platform often; slow ones fill up.
const core = require('./core');
const days = +(process.argv[2] || 40);
const SKILL = { fast: .32, avg: .55, slow: .85 };
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
for (const sk in SKILL) {
  const res = [];
  for (let d = 0; d < days; d++) {
    const R = core.newRun({ seed: 9000 + d }), noise = core.rng32(d * 31 + 7);
    let spawned = 0, left = 0;
    while (!R.over) {
      const b = R.b, base = SKILL[sk] * b.n * b.n * (1 + .15 * b.lv) + 2;
      let t = base * (.7 + (noise() % 600) / 1000);
      if (t > base * 2.2) { core.useHint(R, 1); t = base * 1.6; }
      for (let s = 0; s < t && !R.over; s += .25) core.runTick(R, .25);
      if (R.over) break;
      core.boardSolved(R);
      for (const e of R.ev) { if (e.t === 'lost') spawned++; if (e.t === 'lostLeft') left++; }
      R.ev.length = 0;
      for (let s = 0; s < 2.5; s += .25) core.runTick(R, 0); // transition: clock holds
    }
    res.push({ won: R.won, m: R.m, k: R.k, score: R.score, clears: R.clears, peak: R.peak, spawned, left, deliv: R.delivered.length, st: Object.keys(R.stations).length });
  }
  const won = res.filter(r => r.won).length;
  const ends = res.filter(r => !r.won).map(r => core.clockStr(r.m)).sort();
  console.log(`${sk.padEnd(4)} last train ${Math.round(won / days * 100)}%  boards ${avg(res.map(r => r.k)).toFixed(1)}  score ${Math.round(avg(res.map(r => r.score)))}  clears ${avg(res.map(r => r.clears)).toFixed(1)}  peak ${avg(res.map(r => r.peak)).toFixed(0)}/${core.DAY.cap}  lost ${res.reduce((a, r) => a + r.spawned, 0)} spawned ${res.reduce((a, r) => a + r.deliv, 0)} delivered ${res.reduce((a, r) => a + r.left, 0)} left  stations ${avg(res.map(r => r.st)).toFixed(0)}  full at ${ends.slice(0, 6).join(' ')}${ends.length > 6 ? ' …' : ''}`);
}
