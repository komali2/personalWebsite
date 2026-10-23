<script>
'use strict';
/* =========================================================================
   A service day: clock, platform crowd, line openings, lost riders, score.
   Pure logic (no DOM), also loaded by tools/core.js for the balance sim.
   Board k depends only on (seed, k, board k-1), each with its own rng
   stream, so the daily day is the same on every phone however fast it is.
   ========================================================================= */
const DAY = {
  seconds: 600,          // real seconds from 06:00 to 24:00
  cap: 60,               // people on the platform at 客滿
  start: 8,              // people waiting when the first train is due
  load: .45,             // a train boards load * n * n people
  hint1: 5, hint2: 10,   // people who pile in while you take a hint
  clearBonus: 5,         // × board size, for emptying a platform that held at least clearMin people
  clearMin: 12,
  rushMul: 2,            // score multiplier at rush hour
  // arrivals per real second through the day [game minute from 06:00, rate]; linear in between
  fill: [[0, .2], [50, .27], [70, .85], [170, .85], [200, .38], [360, .38], [420, .45], [470, .38], [640, .4], [660, .85], [780, .85], [810, .36], [960, .27], [1080, .16]],
};
// difficulty by board size: logic level range and how many regulars to keep
const WANT = {
  5: { lvMin: 0, lvMax: 1, reg: 1 }, 6: { lvMin: 1, lvMax: 2, reg: 1 }, 7: { lvMin: 1, lvMax: 3, reg: 2 },
  8: { lvMin: 2, lvMax: 3, reg: 2 }, 9: { lvMin: 2, lvMax: 4, reg: 2 } };
const LAYOUT = {};
function layoutFor(n) { return LAYOUT[n] || (LAYOUT[n] = prepLayout(parseLayout(n))); }
const sizeFor = k => Math.min(9, 5 + (k >> 1));
const isRush = m => (m >= 60 && m < 180) || (m >= 660 && m < 780);
function fillRate(m) {
  const f = DAY.fill;
  for (let i = 1; i < f.length; i++) if (m <= f[i][0]) { const [a, ra] = f[i - 1], [b, rb] = f[i]; return ra + (rb - ra) * (m - a) / (b - a); }
  return f[f.length - 1][1];
}
// "HH:MM" from game minutes after 06:00
const clockStr = m => { const t = 360 + Math.floor(m), h = Math.floor(t / 60) % 24; return String(h).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
// today's date in Taiwan (the daily day flips at Taipei midnight for everyone)
function taipeiDate(now) { const d = new Date((now || Date.now()) + 8 * 3600e3); return d.toISOString().slice(0, 10); }

/* ------------------------------ lost riders -------------------------------
   A lost rider is a regular standing in the wrong line's area. They stay put
   (the generator keeps them in the solution) while the map reshuffles, and
   board the moment their line's area reaches them. */
const LOST_RULE = { from: 9, chance: .4, minBoards: 2, maxBoards: 5 };
// maybe put a lost rider on board b; returns {id, cell, line, boards: 0} or null
function spawnLost(b, rnd) {
  if (typeof LOST === 'undefined' || !LOST.length || b.n < LOST_RULE.from || !b.givens.length) return null;
  if (rint(rnd, 1000) >= LOST_RULE.chance * 1000) return null;
  const cands = [];
  for (const who of LOST) {
    const line = b.lay.ids.indexOf(who.want);
    if (line < 0 || who.need && b.lay.ids.indexOf(who.need) < 0) continue;
    for (const cell of b.givens) {
      if (b.reg[cell] === line) continue;
      const d = dist(b.n, b.lay.tracks[line][b.pos[line]], cell);
      if (d < 3) continue;
      // only where some stop of their line would put this block in its area
      const pos = b.pos.slice();
      let ok = false;
      for (let p = 0; p < b.lay.tracks[line].length && !ok; p++) { pos[line] = p; ok = trainsOk(b.lay, pos) && catchment(b.lay, pos)[cell] === line; }
      if (ok) cands.push({ who, cell, line, d });
    }
  }
  if (!cands.length) return null;
  const c = cands[rint(rnd, cands.length)];
  return { id: c.who.id, cell: c.cell, line: c.line, boards: 0 };
}

/* -------------------------------- the run --------------------------------- */
function newRun(o) {
  o = o || {};
  const seed = o.seed !== undefined ? o.seed >>> 0 : (Math.random() * 4294967296) >>> 0;
  const R = { seed, daily: o.daily || null, k: 0, m: 0, crowd: DAY.start, score: 0, carried: 0, seated: 0, clears: 0, hints: 0,
    delivered: [], stations: {}, over: false, won: false, lost: null, b: null, ev: [], peak: DAY.start, plan: null, planIt: null };
  R.b = runIt(makeBoardIt(R.seed, 0, null, null));
  visit(R, R.b);
  return R;
}
// rng stream for board k
const boardRnd = (seed, k) => rng32((seed ^ Math.imul(k + 1, 0x9E3779B1)) >>> 0);
function* makeBoardIt(seed, k, prev, lost) {
  const n = sizeFor(k), lay = layoutFor(n), rnd = boardRnd(seed, k);
  const want = Object.assign({}, WANT[n]);
  const chained = prev && prev.lay === lay;
  if (chained && lost) want.lost = { cell: lost.cell, line: lost.line, deliver: lost.boards + 1 >= LOST_RULE.minBoards };
  let b = yield* genBoardIt(lay, chained ? prev : null, want, rnd);
  if (!b && chained) b = yield* genBoardIt(lay, prev, Object.assign(want, { extra: 2 }), rnd);
  if (!b && chained && want.lost) { delete want.lost; b = yield* genBoardIt(lay, prev, Object.assign(want, { extra: 2 }), rnd); }
  if (!b) b = yield* genBoardIt(lay, null, WANT[n], rnd);
  b.k = k; b.fresh = !chained;
  return b;
}
/* What solving the current board leads to: the next board and the lost rider's
   fate. Depends only on the current board (never on timing or the crowd), so it
   is computed in the background while the player solves (R.planIt / R.plan). */
function* planNextIt(R) {
  const b = R.b;
  let lost = R.lost ? Object.assign({}, R.lost) : null, delivered = null, left = null;
  if (lost) { lost.boards++; if (b.reg[lost.cell] === lost.line) { delivered = lost; lost = null; } }
  const nb = yield* makeBoardIt(R.seed, b.k + 1, b, lost);
  if (lost && (!nb.givens.includes(lost.cell) || lost.boards >= LOST_RULE.maxBoards || nb.lay !== b.lay)) { left = lost; lost = null; }
  const spawned = lost ? null : spawnLost(nb, boardRnd(R.seed, 1e6 + nb.k));
  return { b: nb, lost: lost || spawned, delivered, left, spawned };
}
function startPlan(R) { R.plan = null; R.planIt = planNextIt(R); }
// work on the plan for up to `ms` (UI) or until done (no ms); returns true when ready
function stepPlan(R, ms, now) {
  if (R.plan) return true;
  if (!R.planIt) startPlan(R);
  const t0 = now ? now() : 0;
  for (;;) {
    const r = R.planIt.next();
    if (r.done) { R.plan = r.value; R.planIt = null; return true; }
    if (ms && now() - t0 > ms) return false;
  }
}
function visit(R, b) { b.pos.forEach((p, l) => { const id = b.lay.stn[l][p]; R.stations[id] = (R.stations[id] || 0) + 1; }); }
// advance the day by dt real seconds while a board is in play
function runTick(R, dt) {
  if (R.over) return;
  const m0 = R.m;
  R.m = Math.min(1080, R.m + dt * 1080 / DAY.seconds);
  R.crowd += fillRate(R.m) * dt;
  if (R.crowd > R.peak) R.peak = R.crowd;
  if (!isRush(m0) && isRush(R.m)) R.ev.push({ t: 'rush' });
  if (isRush(m0) && !isRush(R.m)) R.ev.push({ t: 'rushEnd' });
  if (R.crowd >= DAY.cap) { R.crowd = DAY.cap; R.over = true; R.ev.push({ t: 'full' }); }
  else if (R.m >= 1080) { R.over = true; R.won = true; R.ev.push({ t: 'lastTrain' }); }
}
function useHint(R, level) { R.hints++; R.crowd = Math.min(DAY.cap - .5, R.crowd + (level > 1 ? DAY.hint2 : DAY.hint1)); }
// the board is solved: board the train, score, then move on to the planned next board
function boardSolved(R) {
  const b = R.b, n = b.n, rush = isRush(R.m);
  stepPlan(R);
  const P = R.plan;
  const load = Math.round(DAY.load * n * n), before = R.crowd, boarded = Math.min(Math.floor(R.crowd), load);
  R.crowd -= boarded;
  const clear = R.crowd < 1 && before >= DAY.clearMin;
  if (R.crowd < 1) R.crowd = 0;
  const mul = rush ? DAY.rushMul : 1;
  let pts = (boarded + n) * mul;
  if (clear) { pts += DAY.clearBonus * n * mul; R.clears++; }
  if (P.delivered) { R.delivered.push(P.delivered.id); pts += 10 * n * mul; }
  R.score += pts; R.carried += boarded; R.seated += n;
  R.ev.push({ t: 'solved', boarded, pts, clear, rush, lost: P.delivered, n, prev: b });
  if (P.b.n !== n) R.ev.push({ t: 'open', line: LINE_IDS[P.b.n - 1], n: P.b.n });
  if (P.left) R.ev.push({ t: 'lostLeft', id: P.left.id, cell: P.left.cell });
  if (P.spawned) R.ev.push({ t: 'lost', id: P.spawned.id, cell: P.spawned.cell });
  R.k = P.b.k; R.b = P.b; R.lost = P.lost; R.plan = null; R.planIt = null;
  visit(R, R.b);
  return R.b;
}
</script>
