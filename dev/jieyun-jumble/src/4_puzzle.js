<script>
'use strict';
/* =========================================================================
   Puzzle core: catchment regions, solver, human-style deductions (used for
   grading and hints) and the chained board generator.
   Pure logic, no DOM: tools/core.js loads this file straight into node.
   Everything here is integer math driven by a seeded rng and step counts
   (never the clock), so the daily day is identical on every phone.
   ========================================================================= */

// uint32 seeded rng
function rng32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return (t ^ t >>> 14) >>> 0; }; }
const rint = (r, n) => r() % n;
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
const popc = m => { let c = 0; while (m) { m &= m - 1; c++; } return c; };

/* ------------------------------ catchment ---------------------------------
   Every block belongs to the train that reaches it first. Walking costs
   CW per step, riding along the train's own track costs CT per stop, both
   scaled by the line's reach. Claim-on-settle multi-source Dijkstra, so every
   region is 4-connected and contains its train. Ties: lower cost, then line
   order, then cell index. */
const CATCH = { w: 3, t: 1 };
function catchment(lay, pos) {
  const n = lay.n, N2 = n * n, own = new Int8Array(N2).fill(-1);
  const heap = [];
  const push = k => { heap.push(k); let i = heap.length - 1; while (i) { const p = (i - 1) >> 1; if (heap[p] <= k) break; heap[i] = heap[p]; i = p; } heap[i] = k; };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { let i = 0; const L = heap.length; for (;;) { let c = 2 * i + 1; if (c >= L) break; if (c + 1 < L && heap[c + 1] < heap[c]) c++; if (heap[c] >= last) break; heap[i] = heap[c]; i = c; } heap[i] = last; } return top; };
  // key = cost * 2048 + line * 128 + cell
  for (let l = 0; l < n; l++) push(l * 128 + lay.tracks[l][pos[l]]);
  while (heap.length) {
    const k = pop(), cell = k & 127, l = (k >> 7) & 15, cost = Math.floor(k / 2048);
    if (own[cell] >= 0) continue;
    own[cell] = l;
    const x = cell % n, y = (cell - x) / n, w = lay.reach[l];
    const step = (c, d) => { if (own[c] < 0) push((cost + d) * 2048 + l * 128 + c); };
    if (x > 0) step(cell - 1, CATCH.w * w); if (x < n - 1) step(cell + 1, CATCH.w * w);
    if (y > 0) step(cell - n, CATCH.w * w); if (y < n - 1) step(cell + n, CATCH.w * w);
    const ti = lay.tidx[l][cell];
    if (ti >= 0) { const t = lay.tracks[l], st = lay.straight[l]; if (ti > 0 && st[ti - 1]) step(t[ti - 1], CATCH.t * w); if (ti < t.length - 1 && st[ti]) step(t[ti + 1], CATCH.t * w); }
  }
  return own;
}

// precompute lookups for a layout {n, lines, tracks:[[cell...]...], reach:[..]}
function prepLayout(lay) {
  const n = lay.n;
  lay.tidx = lay.tracks.map(t => { const a = new Int8Array(n * n).fill(-1); t.forEach((c, i) => a[c] = i); return a; });
  // straight[l][i]: the step from stop i to i+1 is orthogonal (catchments only spread along those)
  lay.straight = lay.tracks.map(t => t.map((c, i) => i < t.length - 1 && Math.abs(c % n - t[i + 1] % n) + Math.abs(((c / n) | 0) - ((t[i + 1] / n) | 0)) === 1));
  if (!lay.reach) lay.reach = lay.tracks.map(() => 2);
  return lay;
}

/* -------------------------------- solver ----------------------------------
   Counts solutions up to `limit` (row by row with bitmasks). fixed: cells
   that must hold a commuter. Returns {count, sols: [[cell per row]...]}. */
function solve(n, reg, limit, fixed, keep) {
  const fx = new Int16Array(n).fill(-1);
  if (fixed) for (const c of fixed) fx[(c / n) | 0] = c % n;
  const q = new Int16Array(n), sols = [];
  let count = 0;
  (function row(y, cols, regs, px) {
    if (count >= limit) return;
    if (y === n) { count++; if (sols.length < (keep || 1)) sols.push(Array.from(q, (x, yy) => yy * n + x)); return; }
    const lo = fx[y] >= 0 ? fx[y] : 0, hi = fx[y] >= 0 ? fx[y] : n - 1;
    for (let x = lo; x <= hi; x++) {
      if (cols & (1 << x)) continue;
      if (y && (x === px || x === px - 1 || x === px + 1)) continue;
      const r = reg[y * n + x];
      if (regs & (1 << r)) continue;
      q[y] = x;
      row(y + 1, cols | (1 << x), regs | (1 << r), x);
      if (count >= limit) return;
    }
  })(0, 0, 0, -9);
  return { count, sols };
}

/* ------------------------------ deductions --------------------------------
   The same engine grades boards and writes hints. A state is the set of
   cells that could still hold a commuter plus the placed commuters.
   Rule levels (what a step needs):
     0 single: a row, column or line has one spot left
     1 confined: a line fits in one row/column (or a row in one line)
     2 group: k lines fill exactly k rows/columns (or the reverse)
     3 squeeze: every spot of a row/column/line would rule out a cell
     4 what-if: a commuter here would leave some row/column/line empty */
function mkBoard(n, reg) {
  const N2 = n * n, units = [];
  for (let y = 0; y < n; y++) units.push({ k: 'row', i: y, cells: Array.from({ length: n }, (_, x) => y * n + x) });
  for (let x = 0; x < n; x++) units.push({ k: 'col', i: x, cells: Array.from({ length: n }, (_, y) => y * n + x) });
  for (let l = 0; l < n; l++) units.push({ k: 'line', i: l, cells: [] });
  for (let c = 0; c < N2; c++) units[2 * n + reg[c]].cells.push(c);
  // seen[c] = cells ruled out by a commuter on c
  const seen = [];
  for (let c = 0; c < N2; c++) {
    const x = c % n, y = (c / n) | 0, s = new Set();
    for (let i = 0; i < n; i++) { s.add(y * n + i); s.add(i * n + x); }
    for (const d of units[2 * n + reg[c]].cells) s.add(d);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < n && Y < n) s.add(Y * n + X); }
    s.delete(c); seen.push(Array.from(s));
  }
  return { n, N2, reg, units, seen };
}
function mkState(B) { return { cand: new Uint8Array(B.N2).fill(1), queen: new Uint8Array(B.N2), done: new Uint8Array(3 * B.n) }; }
function cloneState(s) { return { cand: s.cand.slice(), queen: s.queen.slice(), done: s.done.slice() }; }
function unitsOf(B, c) { const n = B.n; return [(c / n) | 0, n + c % n, 2 * n + B.reg[c]]; }
function placeQ(B, s, c) {
  s.queen[c] = 1; s.cand[c] = 0;
  for (const d of B.seen[c]) s.cand[d] = 0;
  for (const u of unitsOf(B, c)) s.done[u] = 1;
}
function candsOf(B, s, u) { const out = []; for (const c of B.units[u].cells) if (s.cand[c]) out.push(c); return out; }
// a state is broken if an unfinished unit has no spot left
function broken(B, s) { for (let u = 0; u < 3 * B.n; u++) if (!s.done[u] && !candsOf(B, s, u).length) return u; return -1; }

// first applicable step at or below maxLv, simplest first: {lv, rule, place?, elim?, units, cells}
function nextStep(B, s, maxLv) {
  const n = B.n, U = 3 * n;
  // level 0: singles
  for (let u = 0; u < U; u++) {
    if (s.done[u]) continue;
    const cs = candsOf(B, s, u);
    if (cs.length === 1) return { lv: 0, rule: 'single', place: cs[0], units: [u], cells: cs };
  }
  if (maxLv < 1) return null;
  // levels 1-2: confinement / groups. kinds: lines->rows, lines->cols, rows->lines, cols->lines
  const open = k => { const a = []; for (let i = 0; i < n; i++) if (!s.done[k * n + i]) a.push(i); return a; };
  const ROW = 0, COL = 1, LINE = 2;
  const maskOf = (from, i, to) => { let m = 0; for (const c of B.units[from * n + i].cells) if (s.cand[c]) m |= 1 << (to === ROW ? (c / n) | 0 : to === COL ? c % n : B.reg[c]); return m; };
  const pairs = [[LINE, ROW], [LINE, COL], [ROW, LINE], [COL, LINE]];
  let found = null;
  for (let k = 1; k <= (maxLv >= 2 ? n - 1 : 1) && !found; k++) {
    for (const [from, to] of pairs) {
      const idx = open(from); if (k >= idx.length) continue;
      const masks = idx.map(i => maskOf(from, i, to));
      // enumerate k-subsets of idx
      const sub = Array.from({ length: k }, (_, i) => i);
      for (;;) {
        let m = 0; for (const j of sub) m |= masks[j];
        if (popc(m) === k) {
          const inS = new Set(sub.map(j => idx[j])), elim = [];
          for (let t = 0; t < n; t++) if (m & (1 << t)) for (const c of B.units[to * n + t].cells) {
            if (!s.cand[c]) continue;
            const fi = from === ROW ? (c / n) | 0 : from === COL ? c % n : B.reg[c];
            if (!inS.has(fi)) elim.push(c);
          }
          if (elim.length) {
            const us = sub.map(j => from * n + idx[j]), ts = []; for (let t = 0; t < n; t++) if (m & (1 << t)) ts.push(to * n + t);
            found = { lv: k === 1 ? 1 : 2, rule: k === 1 ? 'confined' : 'group', k, elim, units: us, targets: ts, cells: us.flatMap(u => candsOf(B, s, u)) };
            break;
          }
        }
        let i = k - 1; while (i >= 0 && sub[i] === idx.length - k + i) i--;
        if (i < 0) break;
        sub[i]++; for (let j = i + 1; j < k; j++) sub[j] = sub[j - 1] + 1;
      }
      if (found) break;
    }
  }
  if (found) return found;
  if (maxLv < 3) return null;
  // level 3: squeeze. Every spot of unit u rules out cell x, so x is out.
  const seenSet = B.seenSet || (B.seenSet = B.seen.map(a => { const m = new Uint8Array(B.N2); for (const d of a) m[d] = 1; return m; }));
  let bestSq = null;
  for (let u = 0; u < U; u++) {
    if (s.done[u]) continue;
    const cs = candsOf(B, s, u); if (cs.length < 2) continue;
    const elim = [];
    for (let x = 0; x < B.N2; x++) {
      if (!s.cand[x] || cs.includes(x)) continue;
      if (cs.every(c => seenSet[c][x])) elim.push(x);
    }
    if (elim.length && (!bestSq || cs.length < bestSq.cells.length)) bestSq = { lv: 3, rule: 'squeeze', elim, units: [u], cells: cs };
  }
  if (bestSq) return bestSq;
  if (maxLv < 4) return null;
  // level 4: what-if. A commuter on x, followed by singles, empties some unit.
  for (let x = 0; x < B.N2; x++) {
    if (!s.cand[x]) continue;
    const t = cloneState(s); placeQ(B, t, x);
    let bad = broken(B, t);
    for (let guard = 0; bad < 0 && guard < B.n; guard++) {
      const st = nextStep(B, t, 0); if (!st) break;
      placeQ(B, t, st.place); bad = broken(B, t);
    }
    if (bad >= 0) return { lv: 4, rule: 'whatif', elim: [x], units: [bad], cells: [x] };
  }
  return null;
}
function applyStep(B, s, st) { if (st.place !== undefined) placeQ(B, s, st.place); else for (const c of st.elim) s.cand[c] = 0; }

// grade a board: solve with logic only. Returns {ok, lv (hardest step), steps, hist[lv]}
function grade(B, givens, maxLv) {
  const s = mkState(B); for (const c of givens || []) placeQ(B, s, c);
  const hist = [0, 0, 0, 0, 0]; let lv = 0, steps = 0;
  for (let guard = 0; guard < 400; guard++) {
    let left = 0; for (let u = 0; u < B.n; u++) if (!s.done[u]) left++;
    if (!left) return { ok: true, lv, steps, hist };
    if (broken(B, s) >= 0) return { ok: false, lv, steps, hist };
    const st = nextStep(B, s, maxLv === undefined ? 4 : maxLv);
    if (!st) return { ok: false, lv, steps, hist };
    hist[st.lv]++; if (st.lv > lv) lv = st.lv; steps++;
    applyStep(B, s, st);
  }
  return { ok: false, lv, steps, hist };
}

/* ------------------------------ generator ---------------------------------
   A board: {n, lay, pos[], dir[], reg, sol[cell per row], givens[], lv, steps}
   Chained boards move every train 0-3 stops along its track (bouncing at the
   ends). The commuters still in the new solution stay as regulars (givens),
   and the map must have exactly one solution with them in place. Fresh boards
   (first board of a size) drop trains anywhere and lock in the fewest waiting
   commuters that make the solution unique. Either way logic alone must solve
   it, at or below want.lvMax. All loops are step-counted, never timed. */
const GEN = { tries: 1500, sols: 60, enough: 30 };
function trainsOk(lay, pos) { const seen = new Set(); for (let l = 0; l < lay.n; l++) { const c = lay.tracks[l][pos[l]]; if (seen.has(c)) return false; seen.add(c); } return true; }
function moveTrain(len, p, d, s) {
  for (let i = 0; i < s; i++) { if (p + d < 0 || p + d > len - 1) d = -d; p += d; }
  return [p, d];
}
// call fn on k-subsets of arr until it returns something truthy
function firstSubset(arr, k, fn) {
  if (k > arr.length) return null;
  const idx = Array.from({ length: k }, (_, i) => i);
  for (;;) {
    const r = fn(idx.map(j => arr[j])); if (r) return r;
    let i = k - 1; while (i >= 0 && idx[i] === arr.length - k + i) i--;
    if (i < 0) return null;
    idx[i]++; for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
  }
}
// the givens for one candidate solution S, or null
function givensFor(n, reg, S, prev, want) {
  const unique = G => solve(n, reg, 2, G).count === 1;
  if (prev) {
    // chained: the regulars are exactly the commuters already in place
    const G = S.filter(c => prev.has(c));
    if (want.lost && !G.includes(want.lost.cell)) return null;
    if (G.length > want.regMax) return null;
    if (G.length >= want.regMin && unique(G)) return G;
    // fallback: a newcomer or two already seated
    if (!want.extra) return null;
    const rest = S.filter(c => !prev.has(c));
    for (let k = 1; k <= want.extra && G.length + k <= want.regMax + 1; k++) {
      const r = firstSubset(rest, k, X => { const H = G.concat(X); return H.length >= want.regMin && unique(H) ? H : null; });
      if (r) return r;
    }
    return null;
  }
  for (let k = want.freshMin; k <= want.freshMax; k++) {
    const r = firstSubset(S, k, G => unique(G) ? G : null);
    if (r) return r;
  }
  return null;
}
const dist = (n, a, b) => Math.abs(a % n - b % n) + Math.abs(((a / n) | 0) - ((b / n) | 0));
// fraction of blocks that changed line
function moved(a, b) { let d = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++; return d / a.length; }
// want: {lvMin, lvMax, reg (target regulars), regMin, regMax, freshMin, freshMax, extra, lost: {cell, line, deliver}}
function genBoard(lay, prev, want, rnd) { return runIt(genBoardIt(lay, prev, want, rnd)); }
// drive a generator to completion (node, or when the next board is needed right now)
function runIt(it) { for (;;) { const r = it.next(); if (r.done) return r.value; } }
// the same search as a resumable generator: yields every few tries so the UI can spread it over frames.
// Results never depend on how it's sliced.
function* genBoardIt(lay, prev, want, rnd) {
  const n = lay.n;
  want = Object.assign({ lvMin: 0, lvMax: 3, reg: 2, regMin: 1, regMax: 3, freshMin: 0, freshMax: 3, extra: 0, lost: null }, want);
  const chained = !!(prev && prev.lay === lay), prevSet = chained ? new Set(prev.sol) : null;
  let best = null, bestScore = -1e9, tries = 0, found = 0;
  for (; tries < GEN.tries; tries++) {
    if (tries % 8 === 7) yield tries;
    let pos, dir;
    if (chained) {
      pos = []; dir = [];
      for (let l = 0; l < n; l++) {
        const [p, d] = moveTrain(lay.tracks[l].length, prev.pos[l], prev.dir[l], [0, 1, 1, 2, 2, 2, 3, 3][rint(rnd, 8)]);
        pos.push(p); dir.push(d);
      }
    } else {
      pos = lay.tracks.map(t => rint(rnd, t.length));
      dir = lay.tracks.map(() => rint(rnd, 2) ? 1 : -1);
    }
    if (!trainsOk(lay, pos)) continue;
    const reg = catchment(lay, pos);
    if (chained && want.lost && reg[want.lost.cell] === want.lost.line && !want.lost.deliver) continue;
    const all = solve(n, reg, GEN.sols, null, GEN.sols);
    if (!all.count) continue;
    let pickS = null, G = null;
    for (const S of all.sols) { G = givensFor(n, reg, S, prevSet, want); if (G) { pickS = S; break; } }
    if (!pickS) continue;
    const B = mkBoard(n, reg), g = grade(B, G, want.lvMax);
    if (!g.ok) continue;
    found++;
    // score: inside the difficulty band, more logic steps, regulars near the target, a visible reshuffle
    let score = Math.min(g.steps, 2 * n) - 25 * Math.max(0, want.lvMin - g.lv);
    score -= 4 * Math.abs(G.length - (chained ? want.reg : want.freshMin));
    let hit = false;
    if (chained) {
      score += 12 * Math.min(moved(prev.reg, reg), .6);
      if (want.lost) {
        // steer the lost rider's train toward them, and when it's time, onto them
        hit = reg[want.lost.cell] === want.lost.line;
        score -= 2 * dist(n, lay.tracks[want.lost.line][pos[want.lost.line]], want.lost.cell);
        if (want.lost.deliver && hit) score += 60;
      }
    }
    if (score > bestScore) { bestScore = score; best = { n, lay, pos, dir, reg, sol: pickS, givens: G, lv: g.lv, steps: g.steps, hist: g.hist, hit }; }
    if (found >= GEN.enough && best.lv >= want.lvMin && (!want.lost || !want.lost.deliver || best.hit || found >= 4 * GEN.enough)) break;
  }
  if (best) best.tries = tries;
  return best;
}
</script>
