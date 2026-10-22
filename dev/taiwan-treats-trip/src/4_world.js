<script>
'use strict';
/* =========================================================================
   World: road geometry, forks, content generation
   ========================================================================= */
const STEP = 8;
let W = 168, H = 360, PY = 238;
let G = null; // the current run

function newRun(o) {
  const seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  rnd = mulberry32(seed);
  G = {
    seed, demo: !!o.demo, veh: o.veh || 'car', lead: o.lead || 'caleb',
    t: 0, score: 0, combo: 0, comboT: 0, bestCombo: 0, belly: 85, charge: 0,
    bx: [0, 0], bh: 0, bc: 0, bcT: 0, bcTarget: 0, brnd: mulberry32(seed ^ 0x5bd1e995),
    regions: [], forks: [], items: [], ents: [], props: [], overhead: [], parts: [], pops: [], rain: [],
    propD: -260,
    p: { x: 0, tx: 0, d: 0, v: 100, spin: 0, iT: 0, f: null, bi: 0, lastC: 0, scrapeT: 0, lean: 0, wob: 0 },
    squad: [], lost: [], hist: [], rescueT: 0,
    storm: { d: -300, v: 0, freeze: 0, munch: 0, glitch: 0 },
    drone: 0, cool: 0, whimsy: 0, kung: 0,
    truckT: 9, shake: 0, flash: 0, bolt: null, boltT: 3, gust: 0, gustT: 2, inStorm: 0, twisty: 0,
    regIdx: 0, route: [], over: false, overT: 0, k: 0,
    tally: {}, eatLog: [], fTally: {}, stats: { snacks: 0, hits: 0, kicked: 0, rare: 0, rescued: 0, lostAt: {}, stolen: 0, scrapes: 0 },
    camX: 0, bannerT: 0,
  };
  CREW.forEach(c => G.fTally[c] = {});
  // squad order: leader first, then everyone else
  const order = [G.lead, ...CREW.filter(c => c !== G.lead)];
  G.squad = (G.veh === 'scooter' ? order : [G.lead]).map((id, i) => ({ id, x: 0, d: -i * 15, lean: 0 }));
  G.crew = order;
  addRegion('taipei', -320);
  G.route.push('taipei');
  extendBase(800);
  G.p.x = G.p.tx = G.p.lastC = baseX(0);
  G.camX = G.p.x;
  G.squad.forEach(s => s.x = G.p.x);
}

/* ---------- base centerline: a curvature-limited wandering road ---------- */
function extendBase(toD) {
  const bx = G.bx;
  while ((bx.length - 1) * STEP < toD) {
    const d = (bx.length - 1) * STEP;
    const tw = REG[regionAt(d).id].twist;
    if (--G.bcT <= 0) { G.bcT = 5 + (G.brnd() * 12 | 0); G.bcTarget = (G.brnd() * 2 - 1) * (.002 + .011 * tw); }
    G.bc += (G.bcTarget - G.bc) * .3;
    const maxH = .12 + .78 * tw, last = bx[bx.length - 1];
    G.bh = clamp(G.bh + G.bc * STEP - last * .00005 * STEP, -maxH, maxH);
    bx.push(last + G.bh * STEP);
  }
}
function baseX(d) {
  if (d < 0) d = 0;
  const f = d / STEP, i = f | 0;
  if (i + 1 >= G.bx.length) extendBase(d + 64);
  const a = G.bx[i];
  return a + (G.bx[i + 1] - a) * (f - i);
}
function regionAt(d) { const R = G.regions; for (let i = R.length - 1; i > 0; i--) if (d >= R[i].d0) return R[i]; return R[0]; }
function mainHW(d) {
  const r = regionAt(d), hw = REG[r.id].hw;
  if (r.k > 0 && d - r.d0 < 120) return lerp(REG[G.regions[r.k - 1].id].hw, hw, ss((d - r.d0) / 120));
  return hw;
}
function forkAt(d) { const F = G.forks; for (let i = 0; i < F.length; i++) { const f = F[i]; if (d < f.d0) return null; if (d < f.d3) return f; } return null; }
function branchOff(f, i, d) {
  const c = (i - (f.n - 1) / 2) * f.sep;
  if (d <= f.d0) return 0;
  if (d < f.d1) return c * ss((d - f.d0) / (f.d1 - f.d0));
  if (d <= f.d2) {
    const b = f.br[i], u = (d - f.d1) / (f.d2 - f.d1), win = Math.sin(Math.PI * clamp(u, 0, 1));
    if (!b.twA) return c;
    if (!b.side) return c + b.twA * win * Math.sin(b.twK * (d - f.d1));
    return c + b.side * b.twA * win * (.5 - .5 * Math.cos(b.twK * (d - f.d1)));
  }
  const t = (d - f.d2) / (f.d3 - f.d2);
  const ch = f.chosen >= 0 ? f.chosen : Math.floor(f.n / 2);
  if (ch === i) return c * (1 - ss(t));
  let s = Math.sign(c); if (!s) s = ch < i ? 1 : -1;
  return c + s * t * t * 320;
}
function branchHW(f, i, d) {
  if (d < f.d1) return lerp(f.hw0, f.bhw, ss((d - f.d0) / (f.d1 - f.d0)));
  if (d <= f.d2 || f.chosen !== i) return f.bhw;
  return lerp(f.bhw, mainHW(f.d3), ss((d - f.d2) / (f.d3 - f.d2)));
}
function inFork(f, d) { return f && d >= f.d0 && d < f.d3; }
function pathX(f, bi, d) { return inFork(f, d) ? baseX(d) + branchOff(f, bi, d) : baseX(d); }
function pathHW(f, bi, d) { return inFork(f, d) ? branchHW(f, bi, d) : mainHW(d); }

/* all road strips at distance d -> RD[cx, hw, stormy]*RN */
const RD = new Float64Array(12); let RN = 0;
function roadsAt(d) {
  RN = 0;
  const f = forkAt(d), bx = baseX(d);
  if (!f) { RD[0] = bx; RD[1] = mainHW(d); RD[2] = 0; RN = 1; return null; }
  for (let i = 0; i < f.n; i++) {
    const off = branchOff(f, i, d);
    if (d > f.d2 && f.chosen !== i && Math.abs(off) > 300) continue;
    RD[RN * 3] = bx + off; RD[RN * 3 + 1] = branchHW(f, i, d);
    RD[RN * 3 + 2] = f.br[i].stormy && d > f.d1 - 50 && d < f.d2 + 40 ? 1 : 0;
    RN++;
  }
  return f;
}
// is x on (or within m of) any road at d?
function onRoad(x, d, m) {
  roadsAt(d);
  for (let i = 0; i < RN; i++) if (Math.abs(x - RD[i * 3]) < RD[i * 3 + 1] + m) return true;
  return false;
}

/* ---------- regions & content ---------- */
function addRegion(id, d0) {
  const r = { id, d0, dEnd: Infinity, k: G.regions.length, gate: null, next: null, nextMade: false, lmDone: false };
  G.regions.push(r);
  genRegion(r);
  return r;
}
function genRegion(r) {
  const def = REG[r.id];
  extendBase(r.d0 + REGION_LEN + 1500);
  let d = r.d0;
  const intro = r.k === 0 ? 700 : 320;
  stretch(r, d, d + intro, r.k === 0 ? .7 : .6, r.k === 0 ? 0 : .3);
  d += intro;
  const end = r.d0 + REGION_LEN;
  while (d < end - 900) {
    const sl = rf(240, 440);
    stretch(r, d, d + sl, 1, 1);
    d += sl;
    d = makeFork(r, d, false).d3;
  }
  stretch(r, d, d + 260, .8, .6);
  d += 260;
  if (def.next.length > 1) { r.gate = makeFork(r, d, true); r.dEnd = r.gate.d3; }
  else { r.next = def.next[0]; r.dEnd = d; G.overhead.push({ type: 'arch', d: d + 30, id: r.next }); }
}
function stretch(r, dA, dB, dens, haz) {
  placeSnacks(r, null, 0, dA, dB, dens, 0);
  if (haz) placeHazards(r, null, 0, dA + (r.k === 0 && dA < 400 ? 300 : 0), dB, haz);
}
function pickSnack(r, boost) {
  const def = REG[r.id];
  if (chance(.011 * (def.rareMul || 1))) return 'zhenzhu';
  if (chance(.16 + (boost || 0))) return pick(def.spec);
  return pick(COMMON);
}
function addItem(id, d, u, f, bi, ex) {
  const it = { id, d, u, f: f || null, bi: bi || 0, dx: 0, ph: rnd() * 6, got: false, mag: 0, z: 0, vz: 0 };
  if (ex) Object.assign(it, ex);
  G.items.push(it);
  return it;
}
function placeSnacks(r, f, bi, dA, dB, dens, boost) {
  let d = dA + rf(20, 60);
  while (d < dB - 40) {
    const kind = pick(['line', 'sine', 'diag', 'cluster', 'arc', 'line', 'sine']);
    const n = Math.max(3, Math.round(rf(4, 7) * (.7 + .3 * Math.min(dens, 1.5))));
    const sp = kind === 'cluster' ? 13 : 19;
    const len = (kind === 'cluster' ? Math.ceil(n / 3) : n) * sp;
    if (d + len > dB - 20) break;
    const u0 = rf(-.55, .55), dir = chance(.5) ? 1 : -1, ph = rf(0, 6);
    for (let j = 0; j < n; j++) {
      let u, dd = j * sp;
      if (kind === 'line') u = u0;
      else if (kind === 'sine') u = .55 * Math.sin(ph + j * .8);
      else if (kind === 'diag') u = dir * lerp(-.62, .62, j / (n - 1));
      else if (kind === 'arc') u = u0 * .4 + dir * .45 * Math.sin(Math.PI * j / (n - 1));
      else { u = u0 * .6 + ((j % 3) - 1) * .26; dd = Math.floor(j / 3) * sp; }
      addItem(pickSnack(r, boost), d + dd, clamp(u, -.72, .72), f, bi);
    }
    d += len + rf(60, 170) / Math.max(.35, dens);
  }
}
function addEnt(e) {
  e.t = 0; e.f = e.f || null; e.bi = e.bi || 0; e.vd = e.vd || 0; e.vu = e.vu || 0; e.act = false; e.dead = false;
  if (G.whimsy > 0 && e.type !== 'rescue' && G.ents.length) { /* whimsy turns new hazards to snacks on activation */ }
  G.ents.push(e);
  return e;
}
function placeHazards(r, f, bi, dA, dB, mul) {
  const def = REG[r.id], k = Math.min(r.k, 9);
  const exp = (dB - dA) / 300 * (.32 + .1 * k) * mul;
  const n = Math.floor(exp + rnd());
  for (let i = 0; i < n; i++) spawnHazard(wpick(def.haz), rf(dA + 50, Math.max(dA + 60, dB - 40)), f, bi);
}
const NPC_SLOTS = ['RlY', 'BtY', 'qnl', 'yGg', 'elR', 'lNo', 'Pwo', 'wRB'];
function spawnHazard(type, d, f, bi) {
  const b = { f, bi };
  switch (type) {
    case 'scooters': {
      const n = ri(3, 6), v = rf(40, 60);
      for (let j = 0; j < n; j++) addEnt({ ...b, type: 'npcscooter', d: d + j * rf(8, 14), u: rf(-.75, .75), vd: v + rf(-6, 6), w: 5, h: 10, slots: pick(NPC_SLOTS), wob: rf(0, 6) });
      break;
    }
    case 'dog': { const cross = chance(.6); addEnt({ ...b, type: 'dog', d, u: cross ? pick([-1.25, 1.25]) : rf(-.6, .6), cross, w: 9, h: 6 }); break; }
    case 'rock': addEnt({ ...b, type: 'rock', d, u: rf(-.65, .65), w: 8, h: 7, fall: -1 }); break;
    case 'slide': {
      const s = pick([-1, 1]);
      addEnt({ ...b, type: 'rubble', d, u: s * .5, w: 16, h: 10 });
      addEnt({ ...b, type: 'cone', d: d - 24, u: s * .3, w: 4, h: 5 });
      addEnt({ ...b, type: 'cone', d: d - 28, u: s * .7, w: 4, h: 5 });
      break;
    }
    case 'bus': addEnt({ ...b, type: 'bus', d, u: -.45, vd: -rf(50, 70), w: 13, h: 33 }); break;
    case 'gravel': addEnt({ ...b, type: 'gravel', d, u: .42, vd: rf(38, 52), w: 13, h: 29 }); break;
    case 'crowd': {
      const s = pick([-1, 1]), n = ri(3, 6), v = rf(.15, .22);
      for (let j = 0; j < n; j++) addEnt({ ...b, type: 'tourist', d: d + rf(-9, 9), u: -s * (1.2 + j * .2), vu: s * v * rf(.9, 1.1), w: 4, h: 6, slots: pick(['R', 'B', 'Y', 'e', 'q', 'o', 'c', 'w']) });
      break;
    }
    case 'monkey': addEnt({ ...b, type: 'monkey', d, u: pick([-.95, .95]), w: 8, h: 8, state: 'sit' }); break;
  }
}
function makeFork(r, d0, gate) {
  const def = REG[r.id];
  const n = gate ? def.next.length : 2;
  const bhw = n === 3 ? 16 : Math.min(21, def.hw - 3);
  const sep = n === 3 ? 2 * bhw + 22 : 2 * bhw + 28;
  const f = { d0, d1: d0 + 90, n, sep, bhw, hw0: mainHW(d0), br: [], chosen: -1, gate, reveal: false, region: r };
  f.d2 = f.d1 + (gate ? 430 : rf(440, 520));
  f.d3 = f.d2 + 130;
  G.forks.push(f);
  if (gate) {
    for (let i = 0; i < n; i++) {
      const dest = def.next[i];
      f.br.push({ dest, level: 1, stormy: false, twA: n === 3 && i === 1 ? 4 : 10, twK: .03, side: i - (n - 1) / 2, spec: REG[dest].spec[0], haz: .5, specB: 0 });
    }
  } else {
    const sc = wpick({ storm: 3.5, twisty: 3, hidden: 2, even: 1.5 });
    const rich = { level: 3, stormy: sc === 'storm', twisty: sc === 'twisty', haz: sc === 'hidden' ? 2.4 : 1.1, specB: .14 };
    const lean = { level: sc === 'even' ? 2 : 1, stormy: sc !== 'even' && chance(.12), twisty: false, haz: .7, specB: sc === 'even' ? .3 : 0 };
    if (sc === 'even') rich.level = 2;
    (chance(.5) ? [rich, lean] : [lean, rich]).forEach((b, i) => {
      b.side = i ? 1 : -1;
      b.twA = b.twisty ? rf(22, 30) : rf(3, 8);
      b.twK = b.twisty ? rf(.045, .07) : rf(.015, .025);
      f.br.push(b);
    });
  }
  for (let i = 0; i < n; i++) {
    const b = f.br[i];
    const i0 = G.items.length, e0 = G.ents.length;
    if (gate) {
      for (let j = 0; j < 4; j++) addItem(pick(REG[b.dest].spec), f.d1 + 70 + j * 70, rf(-.45, .45), f, i);
      placeSnacks(r, f, i, f.d1 + 20, f.d2 - 20, .45, 0);
      placeHazards(r, f, i, f.d1 + 40, f.d2 - 30, b.haz);
    } else {
      placeSnacks(r, f, i, f.d1 + 10, f.d2 - 10, [0, .45, .9, 1.55][b.level], b.specB);
      placeHazards(r, f, i, f.d1 + 30, f.d2 - 20, b.haz);
      const its = G.items.slice(i0);
      const sp = its.find(it => SNACKS[it.id].t === 's');
      b.spec = sp ? sp.id : null;
      b.rare = its.some(it => it.id === 'zhenzhu');
    }
    b.count = G.items.length - i0;
    b.hazN = G.ents.length - e0;
  }
  return f;
}

/* ---------- scenery props (generated lazily just above the screen) ---------- */
function propClear(x, d, w, h) {
  for (let dd = d - 4; dd <= d + h; dd += 6) if (onRoad(x, dd, w / 2 + 2)) return false;
  for (let i = G.props.length - 1, n = 0; i >= 0 && n < 40; i--, n++) {
    const q = G.props[i];
    if (Math.abs(q.x - x) < (q.w + w) / 2 - 1 && Math.abs(q.d - d) < Math.max(q.h, h) * .55) return false;
  }
  return true;
}
function addProp(id, x, d, slots, flip) {
  const s = SPR[id];
  const w = s ? s[0].length : 10, h = s ? s.length : 10;
  if (!propClear(x, d, w, h)) return false;
  G.props.push({ id, x, d, w, h, slots, flip });
  return true;
}
function edges(d) {
  roadsAt(d);
  let L = 1e9, R = -1e9;
  for (let i = 0; i < RN; i++) { L = Math.min(L, RD[i * 3] - RD[i * 3 + 1]); R = Math.max(R, RD[i * 3] + RD[i * 3 + 1]); }
  return [L, R];
}
const PROP_SLOTS = { roof_a: ['B', 'm', 'R', 'E'], roof_b: ['B', 'm', 'R', 'E'], stall: ['R', 'B', 'y', 'e', 'q'], container: ['R', 'B', 'o', 'E', 'y', 'q', 'N'], balloon: ['RY', 'Bc', 'qY', 'eY', 'oR'], rice: ['e', 'y'] };
function genProps(toD) {
  while (G.propD < toD) {
    const d = G.propD;
    G.propD += 12;
    const r = regionAt(d), def = REG[r.id];
    const [L, R] = edges(d);
    if (!r.lmDone && def.lm && d >= r.d0 + (r.k === 0 ? 240 : 140)) {
      const s = SPR[def.lm];
      if (s) {
        const w = s[0].length;
        const sides = def.st === ST.coast || def.st === ST.harbor ? [1] : [1, -1];
        for (const sd of sides) {
          const x = sd > 0 ? R + 14 + w / 2 : L - 14 - w / 2;
          if (addProp(def.lm, x, d)) { r.lmDone = true; break; }
        }
      } else r.lmDone = true;
      if (d > r.d0 + 1600) r.lmDone = true;
    }
    if (r.id === 'jiufen' && hash2(d >> 2, 77) < .09 && d > r.d0 + 80) G.overhead.push({ type: 'lanterns', d });
    const tries = def.st === ST.paddy ? 2 : 3;
    for (let a = 0; a < tries; a++) {
      const list = def.props;
      let tot = 0; list.forEach(e => tot += e[1]);
      let q = rnd() * tot, e = list[0];
      for (const it of list) { q -= it[1]; if (q <= 0) { e = it; break; } }
      const [id, , mn, mx, fixedSide] = e;
      if (id === 'balloon') { if (chance(.18)) G.overhead.push({ type: 'balloon', x: baseX(d) + rf(-80, 80), d, slots: pick(PROP_SLOTS.balloon), ph: rf(0, 6) }); continue; }
      const s = SPR[id]; const w = s ? s[0].length : 10;
      let side = fixedSide || (chance(.5) ? 1 : -1);
      const dist = rf(mn, mx);
      let x = side > 0 ? R + dist + w / 2 : L - dist - w / 2;
      // sometimes drop it in a fork's median instead
      if (RN > 1 && chance(.35) && !fixedSide) {
        const i = ri(0, RN - 2), a0 = RD[i * 3] + RD[i * 3 + 1], b0 = RD[(i + 1) * 3] - RD[(i + 1) * 3 + 1];
        if (b0 - a0 > w + 6) x = rf(a0 + w / 2 + 2, b0 - w / 2 - 2);
      }
      const sl = PROP_SLOTS[id] ? pick(PROP_SLOTS[id]) : undefined;
      addProp(id, Math.round(x), d + rf(0, 10), sl, chance(.5) && !/^lm_|shop|stall|betel|temple/.test(id));
    }
    // mountain roads get guard posts on the drop-off side
    if ((def.st === ST.mountain || def.st === ST.gorge) && (d % 36) < 12) addProp('guardpost', Math.round(R + 7), d);
  }
}
</script>
