<script>
'use strict';
/* =========================================================================
   Play: the board in front of the player (marks, undo, clashes, hints),
   the solve → trains depart → next board sequence, the bot (attract demo
   and headless tests), and save/resume.
   marks: 0 empty, 1 ✕, 2 commuter. lock: commuters placed by the game
   (regulars, waiting commuters, lost riders); they can't be changed.
   ========================================================================= */
let G = null;
const PH = { depart: 3.0, open: 3.6, end: 2.4, calm: 1.3 };

function newGame(o) {
  o = o || {};
  const R = o.snap ? restoreRun(o.snap.R) : newRun({ seed: o.seed, daily: o.daily });
  G = { R, demo: !!o.demo, bot: !!o.demo, botWait: 1.2, phase: 'play', pt: 0, t: 0, undo: [], drag: null, hint: null, clash: null,
    old: null, tick: { msgs: [], over: null, x: 0 }, newStamps: [], crowdShow: R.crowd, warned: false, cheer: 0, pops: [], parts: [] };
  setBoard(R.b, null);
  if (o.snap && o.snap.newStamps) G.newStamps = o.snap.newStamps.slice();
  if (o.snap && o.snap.marks) { o.snap.marks.forEach((m, c) => { if (!G.lock[c]) G.marks[c] = m; }); if (o.snap.face) o.snap.face.forEach((f, c) => { if (f && G.marks[c] === 2) G.face[c] = f; }); refresh(); }
  if (!G.demo && !o.snap) stampBoard(R.b);
  return G;
}

/* ---------- board setup ---------- */
function riderOf(b, c) { return RIDERS[b.lay.ids[b.reg[c]]].sprite; }
function lostOf(id) { return LOST.find(l => l.id === id); }
// prev: {b, face, marks} of the board just solved (same layout) or null
function setBoard(b, prev) {
  const n = b.n, N2 = n * n;
  G.marks = new Uint8Array(N2); G.lock = new Uint8Array(N2); G.face = new Array(N2).fill(null);
  G.byHint = new Uint8Array(N2);
  for (const c of b.givens) {
    G.marks[c] = 2; G.lock[c] = 1;
    // regulars keep their look; newcomers dress for their line
    G.face[c] = prev && prev.b.lay === b.lay && prev.face[c] ? prev.face[c] : riderOf(b, c);
  }
  if (G.R.lost && b.givens.includes(G.R.lost.cell)) G.face[G.R.lost.cell] = lostOf(G.R.lost.id).sprite;
  G.B = mkBoard(n, b.reg);
  G.undo = []; G.hint = null; G.drag = null;
  startPlan(G.R);
  refresh();
  tickerReset();
}

/* ---------- rules and clashes ---------- */
// what's wrong right now: stripe = blocks to stripe, bad = commuters in a clash, kinds = rules broken, done = rules fully met
function clashState() {
  const b = G.R.b, n = b.n, N2 = n * n, m = G.marks;
  const row = new Array(n).fill(0), col = new Array(n).fill(0), line = new Array(n).fill(0), q = [];
  for (let c = 0; c < N2; c++) if (m[c] === 2) { q.push(c); row[(c / n) | 0]++; col[c % n]++; line[b.reg[c]]++; }
  const stripe = new Uint8Array(N2), bad = new Uint8Array(N2), kinds = { row: 0, col: 0, line: 0, touch: 0 };
  for (let c = 0; c < N2; c++) {
    const y = (c / n) | 0, x = c % n, l = b.reg[c];
    if (row[y] > 1) { stripe[c] = 1; kinds.row = 1; if (m[c] === 2) bad[c] = 1; }
    if (col[x] > 1) { stripe[c] = 1; kinds.col = 1; if (m[c] === 2) bad[c] = 1; }
    if (line[l] > 1) { stripe[c] = 1; kinds.line = 1; if (m[c] === 2) bad[c] = 1; }
  }
  for (let i = 0; i < q.length; i++) for (let j = i + 1; j < q.length; j++) {
    const a = q[i], d = q[j];
    if (Math.abs(a % n - d % n) <= 1 && Math.abs(((a / n) | 0) - ((d / n) | 0)) <= 1) { stripe[a] = stripe[d] = bad[a] = bad[d] = 1; kinds.touch = 1; }
  }
  const all = a => a.every(v => v === 1);
  const done = { row: all(row), col: all(col), line: all(line), touch: q.length === n && !kinds.touch };
  return { stripe, bad, kinds, done, count: q.length, any: kinds.row || kinds.col || kinds.line || kinds.touch };
}
function refresh() {
  const before = G.clash ? G.clash.kinds : null;
  G.clash = clashState();
  if (before && !G.demo) {
    // a new kind of clash: a soft sound and an etiquette joke
    const fresh = ['touch', 'row', 'col', 'line'].find(k => G.clash.kinds[k] && !before[k]);
    if (fresh) { SFX.clash(); const pool = CLASH[fresh]; showMsg(N(pool[Math.floor(mr() * pool.length)]), 'clash', 2.6); }
  }
}
const isSolved = () => G.clash.count === G.R.b.n && !G.clash.any;

/* ---------- player actions ---------- */
function commuterCount() { let k = 0; for (const v of G.marks) if (v === 2) k++; return k; }
// changes: [[cell, to]]; join = add to the last undo group (drag painting)
function setMarks(changes, join) {
  const grp = [];
  for (const [c, to] of changes) {
    if (G.lock[c] || G.marks[c] === to) continue;
    grp.push([c, G.marks[c], to]);
    G.marks[c] = to;
    if (to === 2) G.face[c] = riderOf(G.R.b, c);
    G.byHint[c] = 0;
  }
  if (!grp.length) return false;
  // a whole drag is one undo step: 'start' opens the group, 'add' appends to it
  if (join === 'add' && G.undo.length && G.undo[G.undo.length - 1].join) G.undo[G.undo.length - 1].ch.push(...grp);
  else G.undo.push({ ch: grp, join: !!join });
  if (G.undo.length > 300) G.undo.shift();
  if (G.hint && !G.hint.keep) G.hint = null;
  if (!G.demo) {
    const last = grp[grp.length - 1][2];
    if (last === 2) { SFX.place(commuterCount() - 1); G.pops.push({ c: grp[grp.length - 1][0], t: 0 }); } else if (last === 1) SFX.mark(); else SFX.unmark();
  }
  refresh();
  if (isSolved()) solved();
  return true;
}
function tapCell(c) {
  if (G.phase !== 'play') return;
  showStation(c);
  if (G.lock[c]) {
    if (G.R.lost && c === G.R.lost.cell) lostSpeak('ask');
    else if (!G.demo) toast(T('regular'));
    return;
  }
  setMarks([[c, (G.marks[c] + 1) % 3]]);
}
function paintCell(c, first) { if (G.phase === 'play' && !G.lock[c] && G.marks[c] === 0) setMarks([[c, 1]], first ? 'start' : 'add'); }
function endDrag() { if (G && G.undo.length) G.undo[G.undo.length - 1].join = false; }
function undoMove() {
  if (G.phase !== 'play' || !G.undo.length) return;
  const g = G.undo.pop();
  for (let i = g.ch.length - 1; i >= 0; i--) { const [c, from] = g.ch[i]; G.marks[c] = from; if (from === 2) G.face[c] = riderOf(G.R.b, c); }
  G.hint = null; SFX.undo(); refresh();
}
function clearMarks() {
  if (G.phase !== 'play') return;
  const ch = []; G.marks.forEach((v, c) => { if (v && !G.lock[c]) ch.push([c, 0]); });
  if (ch.length) { setMarks(ch); SFX.undo(); }
}

/* ---------- hints ---------- */
// the logic state the player has reached: their commuters placed, their ✕s ruled out
function stateFromMarks() {
  const s = mkState(G.B);
  G.marks.forEach((v, c) => { if (v === 2) placeQ(G.B, s, c); });
  G.marks.forEach((v, c) => { if (v === 1) s.cand[c] = 0; });
  return s;
}
const unitKind = (n, u) => u < n ? 'row' : u < 2 * n ? 'col' : 'line';
function hintText(st) {
  const n = G.R.b.n, ids = G.R.b.lay.ids, kind = u => unitKind(n, u), ln = u => lineName(ids[u - 2 * n]);
  if (st.rule === 'single') return T('h_single_' + kind(st.units[0]), [kind(st.units[0]) === 'line' ? ln(st.units[0]) : '']);
  if (st.rule === 'confined') {
    const f = kind(st.units[0]), t = kind(st.targets[0]);
    return T(`h_conf_${f}_${t}`, [f === 'line' ? ln(st.units[0]) : ln(st.targets[0])]);
  }
  if (st.rule === 'group') return T(`h_group_${kind(st.units[0])}_${kind(st.targets[0])}`, [st.k]);
  if (st.rule === 'squeeze') { const k = kind(st.units[0]); return T('h_squeeze_' + k, [k === 'line' ? ln(st.units[0]) : '']); }
  return T('h_whatif');
}
function hint() {
  if (G.phase !== 'play') return;
  const b = G.R.b, sol = new Set(b.sol);
  // second press while a hint is up: just place one
  if (G.hint && G.hint.lv === 1) return hintPlace();
  const wrong = [], wrongX = [];
  G.marks.forEach((v, c) => { if (v === 2 && !G.lock[c] && !sol.has(c)) wrong.push(c); if (v === 1 && sol.has(c)) wrongX.push(c); });
  useHint(G.R, 1); SFX.hint();
  if (wrong.length || wrongX.length) {
    G.hint = { lv: 1, wrong, wrongX, cells: [], elim: [], t: 0 };
    showMsg(wrong.length ? T('h_wrong') : T('h_wrongX'), 'hint', 5);
    return;
  }
  const st = nextStep(G.B, stateFromMarks(), 4);
  if (!st) return hintPlace();
  G.hint = { lv: 1, step: st, cells: st.cells || [], elim: st.elim || [], place: st.place, wrong: [], wrongX: [], t: 0 };
  showMsg(hintText(st), 'hint', 7);
}
function hintPlace() {
  const b = G.R.b, sol = new Set(b.sol);
  // take back mistakes first, then place the step's commuter (or any missing one)
  const fix = []; G.marks.forEach((v, c) => { if (!G.lock[c] && ((v === 2 && !sol.has(c)) || (v === 1 && sol.has(c)))) fix.push([c, 0]); });
  if (fix.length) setMarks(fix);
  let c = G.hint && G.hint.place !== undefined ? G.hint.place : -1;
  if (c < 0 || G.marks[c] === 2) {
    const s = stateFromMarks(), st = nextStep(G.B, s, 4);
    c = st && st.place !== undefined ? st.place : b.sol.find(x => G.marks[x] !== 2);
  }
  if (c === undefined || c < 0) return;
  useHint(G.R, 2); SFX.hint();
  G.hint = null;
  showMsg(T('h_place'), 'hint', 2);
  setMarks([[c, 2]]);
  if (G.marks[c] === 2) { G.byHint[c] = 1; G.hint = { lv: 2, cells: [c], elim: [], wrong: [], wrongX: [], t: 0, keep: false }; }
}

/* ---------- lost riders ---------- */
function lostSpeak(which) {
  // (may run from a timer after the player has left the run)
  if (!G || G.demo || state !== 'play') return;
  const id = which === 'thanks' ? G.lastDelivered : G.R.lost && G.R.lost.id;
  if (!id) return;
  const who = lostOf(id), line = who[which];
  if (who.voice === 'tw') showMsg(line.tw, 'lost', 4, N(line));
  else if (who.voice === 'en') showMsg(line.en, 'lost', 4, LANG === 'zh' ? line.zh : '');
  else showMsg(line.zh, 'lost', 4, LANG === 'zh' ? '' : line.en);
  SFX.lost();
}

/* ---------- solve → depart → next board ---------- */
function solved() {
  const R = G.R, b = R.b;
  G.old = { b, face: G.face.slice(), marks: G.marks.slice(), crowd: R.crowd };
  boardSolved(R);
  const evs = R.ev.splice(0);
  const sv = evs.find(e => e.t === 'solved'), open = evs.find(e => e.t === 'open');
  G.solvedEv = sv; G.crowdShow = G.old.crowd;
  G.phase = open ? 'open' : 'depart'; G.pt = 0;
  G.openEv = open || null;
  if (!G.demo) {
    SFX.solved(); setTimeout(() => SFX.chime(), 250);
    if (sv.clear) setTimeout(() => { SFX.clear(); banner(T('clearBanner'), '月台淨空'); tickerEvent('clear'); }, 900);
    if (sv.lost) { G.lastDelivered = sv.lost.id; save.found[sv.lost.id] = (save.found[sv.lost.id] || 0) + 1; G.newLost = (G.newLost || 0) + 1; setTimeout(() => { SFX.deliver(); lostSpeak('thanks'); }, 500); }
    for (const e of evs) {
      if (e.t === 'lostLeft') setTimeout(() => toast(T('lostLeft', [N(lostOf(e.id))])), 1800);
      if (e.t === 'lost') setTimeout(() => { if (!G.demo) lostSpeak('ask'); }, (open ? PH.open : PH.depart) * 1000);
    }
  }
  if (!G.demo) {
    const g = geo(b.n);
    burst(g.x + g.S / 2, g.y + g.S / 2, 26, 'spark');
    floatText(W / 2, LAY.platY + 4, '+' + sv.pts, sv.rush ? 'o' : 'Y');
    if (sv.clear) setTimeout(() => burst(W / 2, LAY.platY + 14, 40, 'confetti'), 900);
    if (sv.lost) { const [x, y] = cellXY(g, sv.lost.cell); burst(x + g.cs / 2, y, 10, 'heart'); }
  }
  // the next board is set up now; the renderer animates from G.old to it
  setBoard(R.b, G.old);
  if (!G.demo) stampBoard(R.b);
  if (save.reduce) G.pt = (G.phase === 'open' ? PH.open : PH.depart) - PH.calm;
}
function stampBoard(b) {
  b.pos.forEach((p, l) => { const id = b.lay.stn[l][p]; if (!save.stamps[id]) G.newStamps.push(id); save.stamps[id] = (save.stamps[id] || 0) + 1; });
}

/* ---------- the clock, events and the bot ---------- */
function updateGame(dt) {
  G.t += dt; G.pt += dt;
  const R = G.R;
  for (const p of G.pops) p.t += dt; G.pops = G.pops.filter(p => p.t < .4);
  if (G.hint) G.hint.t += dt;
  if (G.phase === 'play') {
    // background: plan the next board a few ms per frame
    if (!R.plan) stepPlan(R, G.demo ? 3 : 5, () => performance.now());
    runTick(R, dt);
    G.crowdShow = R.crowd;
    for (const e of R.ev.splice(0)) {
      if (e.t === 'rush' && !G.demo) { SFX.rush(); banner(T('rushBanner'), T('rushSub')); tickerEvent('rush'); }
      if (e.t === 'full' || e.t === 'lastTrain') { G.phase = 'end'; G.pt = 0; G.endWon = e.t === 'lastTrain';
        if (!G.demo) { if (G.endWon) { SFX.last(); banner(T('lastTrain'), '末班車'); tickerEvent('last'); } else { SFX.full(); banner(T('overFull'), '客滿'); } } }
    }
    const hi = R.crowd > DAY.cap * .8;
    if (hi && !G.warned && !G.demo) { SFX.warn(); tickerEvent('full'); G.warned = true; }
    if (!hi && R.crowd < DAY.cap * .7) G.warned = false;
    if (G.bot && G.phase === 'play') { G.botWait -= dt; if (G.botWait <= 0) { botMove(); G.botWait = G.botSpeed || (G.demo ? .38 + mr() * .3 : .02); } }
  } else if (G.phase === 'depart' || G.phase === 'open') {
    const dur = G.phase === 'open' ? PH.open : PH.depart;
    const tb = G.phase === 'open' ? 1.0 : .8;  // when people start boarding
    G.crowdShow = lerp(G.old.crowd, R.crowd, ss((G.pt - tb) / .6));
    if (!G.demo && G.pt - dt < tb + .55 && G.pt >= tb + .55) SFX.board();
    if (!G.demo && G.pt - dt < 1.45 && G.pt >= 1.45) SFX.doors();
    if (!G.demo && G.pt - dt < 2.2 && G.pt >= 2.2) SFX.depart();
    if (G.phase === 'open' && !G.demo && G.pt - dt < 1.2 && G.pt >= 1.2) {
      SFX.open(); const id = G.openEv.line;
      banner(T('open', [lineName(id)]), String(LINES[id].year), LANG === 'zh' ? LINES[id].en : LINES[id].zh); tickerEvent('open', { line: lineName(id), year: LINES[id].year });
    }
    if (G.pt >= dur) { G.phase = 'play'; G.pt = 0; G.old = null; G.botWait = G.demo ? 1.4 : .3; }
  } else if (G.phase === 'end') {
    if (G.pt >= (G.demo ? 1 : PH.end)) { G.phase = 'done'; onRunEnd(); }
  }
}
// one bot action: mark a ✕ the logic rules out, or seat the commuter it finds
function botMove() {
  const st = nextStep(G.B, stateFromMarks(), 4);
  if (!st) { const c = G.R.b.sol.find(x => G.marks[x] !== 2); if (c !== undefined) setMarks([[c, 2]]); return; }
  if (st.place !== undefined) { setMarks([[st.place, 2]]); return; }
  const c = st.elim.find(x => G.marks[x] === 0);
  if (c !== undefined) setMarks([[c, 1]]);
  else for (const x of st.elim) G.marks[x] = 1;  // never happens: elims are always open blocks
}

/* ---------- save / resume ---------- */
function serializeRun(R) {
  const b = R.b;
  return { seed: R.seed, daily: R.daily, k: R.k, m: R.m, crowd: R.crowd, score: R.score, carried: R.carried, seated: R.seated, clears: R.clears, hints: R.hints,
    delivered: R.delivered, stations: R.stations, lost: R.lost, peak: R.peak,
    b: { n: b.n, pos: b.pos, dir: b.dir, reg: Array.from(b.reg), sol: b.sol, givens: b.givens, k: b.k, lv: b.lv, steps: b.steps, fresh: b.fresh } };
}
function restoreRun(s) {
  const R = Object.assign({ over: false, won: false, ev: [], plan: null, planIt: null }, s);
  R.b = Object.assign({}, s.b, { lay: layoutFor(s.b.n), reg: Int8Array.from(s.b.reg) });
  return R;
}
function snapshotRun() {
  if (!G || G.demo || G.phase === 'end' || G.phase === 'done' || G.R.over) return;
  save.run = { v: 1, R: serializeRun(G.R), marks: Array.from(G.marks), face: G.face, newStamps: G.newStamps };
  persist();
}
function clearRun() { save.run = null; persist(); }
</script>
