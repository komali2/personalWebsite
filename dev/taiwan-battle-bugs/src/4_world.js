<script>
'use strict';
/* =========================================================================
   World: runs, forks, guards, rewards, leveling
   ========================================================================= */
let G = null;
const xpNeed = lv => 24 + 10 * lv;

function newRun(o) {
  rnd = o.seed ? mulberry32(o.seed) : Math.random;
  const b = BUGS[o.bug];
  G = {
    demo: !!o.demo, bot: !!o.demo, bug: o.bug, t: 0, pt: 0, phase: 'fork', bush: 0, belly: 0,
    lv: 1, xp: 0, pts: 0, spent: { atk: 0, spa: 0, hp: 0, spd: 0 }, st: { ...b.base }, hp: b.base.hp,
    score: 0, stats: { leaves: 0, stars: 0, beaten: 0, elites: 0, farmers: 0, killer: null, time: 0 },
    fork: null, sel: -1, node: null, B: null, fx: [], nums: [], shake: 0, flashT: 0, over: false, won: false,
    bite: [], forkN: 0, prevBest: save.best,
  };
  if (o.snap) restoreRun(o.snap);
  newFork();
  if (!G.demo) snapshotRun();
}

/* ---------- stat points ---------- */
function gainPts(n) { G.pts += n; }
function allocate(s) {
  if (G.pts <= 0 || !STATS.includes(s)) return false;
  const g = BUGS[G.bug].grow[s];
  G.pts--; G.spent[s]++; G.st[s] += g;
  if (s === 'hp') G.hp += g;
  return true;
}
function gainXP(n) {
  G.xp += n;
  let ups = 0;
  while (G.xp >= xpNeed(G.lv)) { G.xp -= xpNeed(G.lv); G.lv++; ups++; gainPts(1); }
  if (ups) { banner(T('levelUp'), 'Lv ' + G.lv); SFX.level(); burst(W / 2, H * .72, 18, [C.Y, C.c, C.w]); }
  return ups;
}
function heal(n) { G.hp = Math.min(G.st.hp, G.hp + n); }
const hpFrac = () => G.hp / G.st.hp;

/* ---------- forks ----------
   Each fork has 2-3 branches; each branch ends in a leaf (1-3★) that may be guarded.
   Tasty leaves are guarded more often (bug-bitten tea tastes best). */
function newFork() {
  const h = G.belly, n = h < 2 ? 2 : (chance(.55) ? 3 : 2);
  const br = [];
  for (let i = 0; i < n; i++) {
    const p3 = .04 + .07 * h + .03 * G.bush, p2 = .38;
    const stars = chance(p3) ? 3 : chance(p2 / (1 - p3)) ? 2 : 1;
    const gp = [0, .2, .45, .72][stars] + .04 * G.bush;
    br.push({ stars, guard: chance(gp) ? makeGuard(stars) : null });
  }
  // at least one branch worth thinking about
  if (br.every(b => b.stars === 1)) br[ri(0, n - 1)].stars = 2;
  const xs = n === 2 ? [.27, .73] : [.17, .5, .83];
  br.forEach((b, i) => { b.x = xs[i] + rf(-.03, .03); b.y = .29 + rf(-.03, .04) + (i === 1 && n === 3 ? -.05 : 0); b.cx = rf(-.08, .08); b.cy = rf(.1, .2); b.sway = rf(0, 6); });
  G.fork = { br, seed: (rnd() * 1e9) | 0 };
  G.forkN++;
}
function foePower(stars, elite) {
  return Math.max(0, 11 * G.bush + 1.3 * G.belly + 2 * (stars - 1) + rf(-1, 2) + (elite ? 5 : 0));
}
function makeGuard(stars) {
  const elite = stars === 3 && G.belly >= 3 && chance([.05, .12, .2][G.bush]);
  let id = 'hornet';
  if (!elite) {
    const w = {};
    for (const f of FOE_IDS) if (FOES[f].w[G.bush]) w[f] = FOES[f].w[G.bush];
    for (const b of BUG_IDS) if (b !== G.bug) w[b] = BUG_AS_FOE_W[G.bush];
    id = wpick(w);
  }
  return { id, E: foePower(stars, elite), elite, hidden: !elite && chance(.25) };
}
const sizeOf = id => (BUGS[id] || FOES[id]).size;
// on-screen scale of a bug relative to the player's own bug (camera scales to you)
const relScale = id => clamp(Math.pow(2, (sizeOf(id) - BUGS[G.bug].size) * .7), .35, 3.2);

/* ---------- rewards ---------- */
function leafStars(node) { return node.stars + (G.bug === 'hopper' ? 1 : 0); }
function eatLeaf() {
  const node = G.node, stars = leafStars(node), mul = 1 + .5 * G.bush;
  heal(G.st.hp * (.06 + .06 * stars) * (G.bug === 'stink' ? 1.5 : 1));
  const bonus = (node.stars >= 3 ? 1 : 0) + (node.fought ? 1 : 0) + (node.elite ? 2 : 0);
  if (bonus) { gainPts(bonus); numAt(W / 2 + 26, H * .4, '+' + bonus + ' PT', C.c); }
  G.score += stars * 10 * (1 + G.bush);
  G.stats.leaves++; G.stats.stars += stars;
  G.belly++;
  numAt(W / 2 - 18, H * .4, '★'.repeat(Math.min(stars, 4)), C.Y);
  gainXP(Math.round(6 * stars * mul));
  SFX.leaf(stars);
  // the bug comments on its (questionable) diet now and then
  if (!G.demo && !quiet() && typeof EAT !== 'undefined' && EAT[G.bug] && (G.stats.leaves === 1 || mr() < .2)) toast(EAT[G.bug][mr() * EAT[G.bug].length | 0][LANG]);
}
function foeXP(f) { return Math.round((8 + f.E * 1.2) * (f.elite ? 2 : 1)); }

/* ---------- saved runs (resume after the tab is killed) ---------- */
function snapshotRun() {
  if (!G || G.demo || G.over || state === 'sim') return;
  // taken at forks; a fight in progress resumes at the fork before it
  if (G.phase === 'fork' || !G.snapAt) {
    const { bug, bush, belly, lv, xp, pts, spent, st, hp, score, stats } = G;
    G.snapAt = JSON.parse(JSON.stringify({ bug, bush, belly, lv, xp, pts, spent, st, hp, score, stats }));
  }
  save.run = G.snapAt;
  persist();
}
function restoreRun(s) {
  for (const k of ['bush', 'belly', 'lv', 'xp', 'pts', 'hp', 'score']) if (typeof s[k] === 'number') G[k] = s[k];
  Object.assign(G.spent, s.spent || {}); Object.assign(G.st, s.st || {}); Object.assign(G.stats, s.stats || {});
}
function clearRun() { save.run = null; persist(); }
</script>
