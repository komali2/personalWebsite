<script>
'use strict';
/* =========================================================================
   Simulation
   ========================================================================= */
const mr = Math.random; // cosmetic randomness (keeps the seeded world reproducible)
const keys = { l: 0, r: 0 };
const VEH = { car: { hw: 5, hh: 9, pw: 6 }, scooter: { hw: 3, hh: 6, pw: 3 } };

function update(dt) {
  const p = G.p;
  if (G.over) { G.overT += dt; G.storm.d += 160 * dt; updateParts(dt); return; }
  G.t += dt;
  const ts = G.cool > 0 ? .5 : 1, wdt = dt * ts;
  for (const k of ['drone', 'cool', 'whimsy', 'kung']) if (G[k] > 0) G[k] = Math.max(0, G[k] - dt);
  if (G.demo || G.bot) botSteer(dt);
  updatePlayer(dt, ts);
  updateRegion();
  genProps(p.d + PY + 90);
  updateItems(dt, wdt);
  updateEnts(dt, wdt);
  spawnTrucks(dt);
  spawnRescue(dt);
  updateStorm(dt, wdt);
  updateParts(dt);
  G.comboT -= wdt;
  if (G.comboT <= 0 && G.combo) G.combo = 0;
  G.shake = Math.max(0, G.shake - dt);
  G.flash = Math.max(0, G.flash - dt);
  if ((G.pruneT = (G.pruneT || 0) - dt) < 0) { G.pruneT = .5; prune(); }
  updateCamera(dt);
}
function updateCamera(dt) {
  const p = G.p, tgt = pathX(p.f, p.bi, p.d + 40) * .6 + p.x * .4;
  G.camX += (tgt - G.camX) * (1 - Math.exp(-dt * 4));
  G.camX = clamp(G.camX, p.x - W / 2 + 18, p.x + W / 2 - 18);
}

/* ---------- player ---------- */
function updatePlayer(dt, ts) {
  const p = G.p, k = Math.min(G.k, 10), V = VEH[G.veh];
  G.belly = clamp(G.belly - (4.4 + .3 * k) * dt * ts, 0, 100);
  const vmax = (136 + 4 * k) * (G.veh === 'car' ? 1.1 : 1);
  let v = 50 + (vmax - 50) * Math.pow(G.belly / 100, .7);
  if (p.spin > 0) v *= .35;
  if (G.twisty) v *= .9;
  if (G.kung > 0) v = vmax * 1.6;
  p.v += (v - p.v) * (1 - Math.exp(-dt * (p.spin > 0 ? 8 : 2.5)));
  p.d += p.v * dt * ts;

  const f = forkAt(p.d);
  if (f) {
    p.f = f;
    if (f.chosen < 0) {
      let best = 0, bd = 1e9;
      for (let i = 0; i < f.n; i++) { const dx = Math.abs(p.x - pathX(f, i, p.d)); if (dx < bd) { bd = dx; best = i; } }
      p.bi = best;
      if (separated(f, p.d)) commit(f, best);
    } else p.bi = f.chosen;
  } else { p.f = null; p.bi = 0; }
  // reveal the next fork while the drone is up
  if (G.drone > 0) { const nf = G.forks.find(q => q.d0 > p.d); if (nf) nf.reveal = true; }

  const b = p.f && p.d > p.f.d1 && p.d < p.f.d2 ? p.f.br[p.bi] : null;
  G.inStorm = b && b.stormy ? 1 : 0;
  G.twisty = b && b.twisty ? 1 : 0;

  // road-follow assist: curves move you with the road, mostly
  const c = pathX(p.f, p.bi, p.d), dc = c - p.lastC;
  p.lastC = c;
  if (Math.abs(dc) < 12) { const a = G.twisty ? .55 : .8; p.x += dc * a; p.tx += dc * a; }
  // gusts inside a storm arm
  if (G.inStorm) { G.gustT -= dt; if (G.gustT < 0) { G.gustT = rf(.7, 1.6); G.gust = (rnd() < .5 ? -1 : 1) * rf(35, 80); } }
  else G.gust *= Math.exp(-dt * 3);
  p.tx += G.gust * (G.veh === 'scooter' ? 1.4 : .75) * dt * (G.cool > 0 ? .3 : 1);
  if (keys.l) p.tx -= 170 * dt;
  if (keys.r) p.tx += 170 * dt;

  const maxV = 230 * dt, dx = clamp(p.tx - p.x, -maxV, maxV) * (p.spin > 0 ? .3 : 1);
  p.x += dx;
  p.lean += (clamp(dx / dt / 90, -1, 1) - p.lean) * Math.min(1, dt * 10);
  // once a branch is chosen, stay on it (a fast swerve could otherwise hop the thin new median)
  const cx = clampToRoad(p.x, p.d, V.pw, p.f && p.f.chosen >= 0 ? pathX(p.f, p.f.chosen, p.d) : p.x);
  if (Math.abs(cx - p.x) > .3) {
    p.x = cx;
    if ((p.scrapeT -= dt) < 0) { p.scrapeT = .12; SFX.scrape(); spark(p.x, p.d); G.stats.scrapes++; }
    p.v *= Math.exp(-dt * 1.2);
  }
  p.tx = clamp(p.tx, p.x - 36, p.x + 36);
  p.spin = Math.max(0, p.spin - dt);
  p.iT = Math.max(0, p.iT - dt);
  updateSquad(dt);
}
function separated(f, d) {
  if (d < f.d0 + (f.d1 - f.d0) * .35) return false;
  for (let i = 0; i < f.n - 1; i++) {
    const a = branchOff(f, i, d) + branchHW(f, i, d), b2 = branchOff(f, i + 1, d) - branchHW(f, i + 1, d);
    if (b2 - a < 1) return false;
  }
  return true;
}
function commit(f, i) {
  f.chosen = i;
  if (f.gate) {
    const r = f.region;
    r.next = f.br[i].dest;
    if (!r.nextMade) { r.nextMade = true; addRegion(r.next, f.d3); }
  }
}
// clamp x to the road strip it is on (merging overlapping strips)
const SP = [];
function clampToRoad(x, d, m, anchor) {
  if (anchor === undefined) anchor = x;
  roadsAt(d);
  SP.length = 0;
  for (let i = 0; i < RN; i++) SP.push([RD[i * 3] - RD[i * 3 + 1], RD[i * 3] + RD[i * 3 + 1]]);
  SP.sort((a, b) => a[0] - b[0]);
  let best = null, bd = 1e9, cur = null;
  const spans = [];
  for (const s of SP) { if (cur && s[0] <= cur[1]) cur[1] = Math.max(cur[1], s[1]); else { cur = [s[0], s[1]]; spans.push(cur); } }
  for (const s of spans) {
    const dd = anchor < s[0] ? s[0] - anchor : anchor > s[1] ? anchor - s[1] : 0;
    if (dd < bd) { bd = dd; best = s; }
  }
  return clamp(x, best[0] + m, best[1] - m);
}
function updateSquad(dt) {
  const p = G.p, h = G.hist;
  if (!h.length || p.d - h[h.length - 1].d >= 2) { h.push({ d: p.d, x: p.x }); if (h.length > 90) h.shift(); }
  G.squad.forEach((s, j) => {
    if (!j) { s.x = p.x; s.d = p.d; s.lean = p.lean; return; }
    const td = p.d - 15 * j;
    let tx = h[0].x;
    for (let i = h.length - 1; i > 0; i--) if (h[i - 1].d <= td) { const a = h[i - 1], b = h[i], t = (td - a.d) / Math.max(.01, b.d - a.d); tx = lerp(a.x, b.x, clamp(t, 0, 1)); break; }
    // follow the leader's recorded path with a little slack, but never onto a different road strip
    const nx = clampToRoad(s.x + (tx - s.x) * Math.min(1, dt * (Math.abs(tx - s.x) > 10 ? 16 : 7)), td, 3, tx);
    s.lean = clamp((nx - s.x) / Math.max(dt, .001) / 90, -1, 1);
    s.d = td;
    s.x = nx;
  });
}

/* ---------- regions ---------- */
function updateRegion() {
  const p = G.p, r = regionAt(p.d);
  if (r.k !== G.regIdx) {
    G.regIdx = r.k; G.k = r.k; G.route.push(r.id);
    if (!G.demo) { SFX.region(); showBanner(r.id); }
  }
  const last = G.regions[G.regions.length - 1];
  if (last.next && !last.nextMade && p.d > last.d0 + (last.dEnd - last.d0) * .35) { last.nextMade = true; addRegion(last.next, last.dEnd); }
}

/* ---------- snacks ---------- */
function itemX(it) { return pathX(it.f, it.bi, it.d) + it.u * pathHW(it.f, it.bi, it.d) + it.dx; }
function comboMult() { return Math.min(8, 1 + Math.floor(G.combo / 6)); }
function updateItems(dt, wdt) {
  const p = G.p, V = VEH[G.veh];
  for (const it of G.items) {
    if (it.got) continue;
    const dd = it.d - p.d;
    if (dd > PY + 40 || dd < -(H - PY) - 20) continue;
    if (it.f && it.f.br[it.bi] && it.f.br[it.bi].stormy && it.d > it.f.d1 && it.d < it.f.d2) {
      const hw = pathHW(it.f, it.bi, it.d);
      it.dx = clamp(it.dx + (Math.sin(G.t * 1.7 + it.ph) * 22 + G.gust * .35) * wdt, -hw * .85 - it.u * hw, hw * .85 - it.u * hw);
    }
    if (it.vz || it.z > 0) {
      it.z += it.vz * wdt; it.vz -= 300 * wdt;
      if (it.z <= 0) { it.z = 0; it.vz = it.vz < -50 ? -it.vz * .35 : 0; }
      if (it.vu) { it.u = clamp(it.u + it.vu * wdt, -.85, .85); it.vu *= Math.exp(-wdt * 2); }
    }
    let x = itemX(it);
    if (G.drone > 0 && dd < 70 && dd > -20 && Math.abs(x - p.x) < 64) it.mag = 1;
    if (it.mag) {
      const t = Math.min(1, wdt * 9);
      it.d += (p.d - it.d) * t;
      it.dx += (p.x - x) * t;
      x = itemX(it);
    }
    if (it.z > 7) continue;
    for (const s of G.squad) {
      if (Math.abs(x - s.x) < V.hw + 5 && Math.abs(it.d - s.d) < V.hh + 5) { collect(it, s, x); break; }
    }
  }
}
function collect(it, s, x) {
  it.got = true;
  const sn = SNACKS[it.id], tr = TIER[sn.t];
  G.combo++; G.comboT = 2.2; G.bestCombo = Math.max(G.bestCombo, G.combo);
  const pts = tr.pts * comboMult();
  G.score += pts;
  G.belly = Math.min(100, G.belly + tr.belly);
  if (!(G.drone || G.cool || G.whimsy || G.kung)) G.charge = Math.min(100, G.charge + tr.chg);
  G.tally[it.id] = (G.tally[it.id] || 0) + 1;
  G.stats.snacks++;
  if (!G.demo) {
    save.eaten[it.id] = (save.eaten[it.id] || 0) + 1;
    if (G.score > save.best) save.best = G.score;
    const key = G.veh + '-' + G.lead;
    if (G.score > (save.bests[key] || 0)) save.bests[key] = G.score;
    dirty();
  }
  if (sn.t === 'r') { G.stats.rare++; G.flash = Math.max(G.flash, .15); }
  const who = G.veh === 'scooter' ? s.id : G.crew[Math.floor(mr() * G.crew.length)];
  G.fTally[who][it.id] = (G.fTally[who][it.id] || 0) + 1;
  G.eatLog.push({ id: it.id, pts, who });
  G.pops.push({ x, d: it.d + 6, txt: '+' + pts, col: sn.t === 'r' ? PAL_HEX[C.Y] : sn.t === 's' ? PAL_HEX[C.c] : PAL_HEX[C.w], t: 0 });
  const sp = SPR[it.id];
  for (let i = 0; i < 5; i++) {
    const row = sp ? sp[3 + (mr() * 6 | 0)] : 'y';
    const ch = row[3 + (mr() * 6 | 0)] || 'y';
    G.parts.push({ x, d: it.d, vx: (mr() - .5) * 80, vd: (mr() - .2) * 60, z: 2, vz: 40 + mr() * 50, life: .45, col: PAL_HEX[C[ch] !== undefined && ch !== '.' && ch !== 'k' ? C[ch] : C.Y] });
  }
  if (!G.demo) SFX.pickup(G.combo, sn.t);
}
function spill(n, thief) {
  const p = G.p;
  for (let i = 0; i < n && G.eatLog.length; i++) {
    const e = G.eatLog.pop();
    G.score = Math.max(0, G.score - e.pts);
    G.tally[e.id]--; G.fTally[e.who][e.id]--; G.stats.snacks--;
    if (!G.demo && save.eaten[e.id] > 0) { save.eaten[e.id]--; dirty(); }
    if (thief) { thief.carry = e.id; G.stats.stolen++; G.pops.push({ x: p.x, d: p.d + 12, txt: '-' + e.pts, col: PAL_HEX[C.R], t: 0 }); }
    else {
      const hw = pathHW(p.f, p.bi, p.d), u = clamp((p.x - pathX(p.f, p.bi, p.d)) / hw, -.8, .8);
      addItem(e.id, p.d + 16 + mr() * 30, u, p.f, p.bi, { z: 3, vz: 110 + mr() * 50, vu: (mr() - .5) * 1.6 });
    }
  }
}

/* ---------- hazards & traffic ---------- */
function entX(e) { return pathX(e.f, e.bi, e.d) + e.u * pathHW(e.f, e.bi, e.d); }
function resolvePath(e) {
  const f = forkAt(e.d);
  if (e.f && e.f !== f) { if (e.f.chosen >= 0 && e.bi !== e.f.chosen && e.d >= e.f.d2) e.dead = true; }
  if (!f) { e.f = null; e.bi = 0; return; }
  if (e.f !== f) {
    e.f = f;
    const p = G.p;
    e.bi = f.chosen >= 0 ? f.chosen : (p.f === f ? p.bi : Math.floor(mr() * f.n));
  }
  if (f.chosen >= 0 && e.bi !== f.chosen && e.d > f.d2) e.dead = true;
}
const SOLID = { npcscooter: 1, dog: 1, rock: 1, rubble: 1, cone: 1, bus: 1, gravel: 1, tourist: 1, monkey: 1, bluetruck: 1 };
function updateEnts(dt, wdt) {
  const p = G.p, V = VEH[G.veh];
  for (const e of G.ents) {
    if (e.dead) continue;
    const dd = e.d - p.d;
    if (!e.act) {
      if (dd < PY + 70) { e.act = true; if (G.whimsy > 0 && SOLID[e.type]) { whimsyPop(e); continue; } }
      else continue;
    }
    e.t += wdt;
    if (e.hitT > 0) e.hitT -= dt;
    switch (e.type) {
      case 'npcscooter': e.d += e.vd * wdt; e.u = clamp(e.u + Math.sin(e.t * 2 + e.wob) * .2 * wdt, -.8, .8); break;
      case 'dog': if (e.cross) { if (!e.vu) e.vu = -Math.sign(e.u) * rf(.28, .42); e.u += e.vu * wdt; if (Math.abs(e.u) > 1.7) e.dead = true; } break;
      case 'rock':
        if (e.fall < 0 && dd < 200) e.fall = 0;
        if (e.fall >= 0 && e.fall < 1) { e.fall = Math.min(1, e.fall + wdt / .9); if (e.fall >= 1) { G.shake = Math.max(G.shake, .12); AU.noise(.2, .15, 300); } }
        break;
      case 'bus': e.d += e.vd * wdt; e.u = -.45 + .32 * Math.max(0, Math.sin(e.t * 1.5 + 1)); break;
      case 'gravel':
        if (e.pull) { e.u += clamp(e.pull * .95 - e.u, -1.3 * wdt, 1.3 * wdt); e.vd = Math.max(8, e.vd - 50 * wdt); }
        e.d += e.vd * wdt;
        break;
      case 'tourist': e.u += e.vu * wdt; if (Math.abs(e.u) > 1.8) e.dead = true; break;
      case 'monkey': {
        const hw = pathHW(e.f, e.bi, e.d);
        if (e.state === 'sit' && dd < 80 && dd > 4) { e.state = 'leap'; e.lt = 0; e.su = e.u; e.tu = clamp((p.x - pathX(e.f, e.bi, e.d)) / hw, -.8, .8); }
        if (e.state === 'leap') { e.lt += wdt; const t = Math.min(1, e.lt / .55); e.u = lerp(e.su, e.tu, ss(t)); e.z = Math.sin(t * Math.PI) * 9; if (t >= 1) { e.state = 'wait'; e.z = 0; } }
        if (e.state === 'flee') { e.u += e.vu * wdt; e.d += 30 * wdt; if (Math.abs(e.u) > 2) e.dead = true; }
        break;
      }
      case 'bluetruck': truckAI(e, dt, wdt); break;
      case 'kicked': e.kx += e.kvx * dt; e.kz += e.kvz * dt; e.kvz -= 260 * dt; if (e.t > 1.4) e.dead = true; break;
    }
    if (e.vd) resolvePath(e);
    if (e.dead || e.type === 'kicked') continue;
    if (e.type === 'rock' && e.fall < .9) continue;
    if (e.type === 'monkey' && e.state === 'flee') continue;
    // collisions
    const ex = entX(e);
    for (const s of G.squad) {
      if (Math.abs(ex - s.x) < (e.w / 2 + V.hw) && Math.abs(e.d - s.d) < (e.h / 2 + V.hh)) { touch(e, s, ex); break; }
    }
  }
}
function touch(e, s, ex) {
  const p = G.p;
  if (e.type === 'rescue') { rescue(e); return; }
  if (G.kung > 0) { kick(e, ex); return; }
  if (p.iT > 0 || e.hitT > 0) return;
  e.hitT = 2.5;
  if (e.type === 'monkey') {
    if (G.eatLog.length) { spill(1, e); if (!G.demo) SFX.steal(); }
    e.state = 'flee'; e.vu = (e.u >= 0 ? 1 : -1) * 1.5; p.iT = .5;
    return;
  }
  const big = e.type === 'bluetruck' || e.type === 'bus' || e.type === 'gravel';
  p.spin = big ? .75 : .5; p.iT = 1.5;
  G.belly = Math.max(0, G.belly - (big ? 12 : 8));
  G.combo = 0; G.comboT = 0;
  spill(2);
  G.shake = .3; G.stats.hits++;
  if (!G.demo) SFX.hit();
  if (e.type === 'dog' || e.type === 'tourist') { e.vu = (ex > p.x ? 1 : -1) * 1.6; e.cross = true; }
  if (e.type === 'npcscooter') e.vd += 40;
  if (e.type === 'gravel') e.pull = ex >= p.x ? 1 : -1;
  if (e.type === 'bluetruck') e.state = 'gone';
  for (let i = 0; i < 8; i++) G.parts.push({ x: p.x, d: p.d + 6, vx: (mr() - .5) * 120, vd: (mr() - .5) * 80, z: 4, vz: 60 + mr() * 60, life: .5, col: PAL_HEX[mr() < .5 ? C.l : C.Y] });
}
function kick(e, ex) {
  const kx = ex - entX({ ...e, u: 0 });
  e.kid = e.type; e.type = 'kicked'; e.t = 0; e.kx = 0; e.kz = 0;
  e.kvx = (ex >= G.p.x ? 1 : -1) * (110 + mr() * 60); e.kvz = 150; e.vd = 0;
  G.score += 20; G.stats.kicked++;
  G.pops.push({ x: ex, d: e.d + 8, txt: '+20', col: PAL_HEX[C.o], t: 0 });
  G.parts.push({ kind: 'kick', x: ex, d: e.d, vx: 0, vd: 0, z: 0, vz: 0, life: .35 });
  G.shake = Math.max(G.shake, .15);
  if (!G.demo) SFX.kick();
  void kx;
}
function rescue(e) {
  e.dead = true;
  const id = e.who, i = G.lost.indexOf(id);
  if (i < 0) return;
  G.lost.splice(i, 1);
  const last = G.squad[G.squad.length - 1];
  G.squad.push({ id, x: last.x, d: last.d - 15, lean: 0 });
  G.stats.rescued++;
  G.pops.push({ x: entX(e), d: e.d + 12, txt: '+1', col: PAL_HEX[C.e], t: 0 });
  if (!G.demo) { SFX.rescue(); toast(T('isBack', [FRIENDS[id].name])); refreshCrew(); }
}
function truckAI(e, dt, wdt) {
  const p = G.p;
  if (e.state === 'warn') {
    e.wt -= dt; e.d = p.d - (H - PY) - 34;
    if (e.f !== p.f) { e.f = p.f; e.bi = p.bi; }
    if (e.wt <= 0) { e.state = 'go'; e.vd = p.v + 80; e.uT = 1; e.tu = e.u; }
    return;
  }
  e.uT -= wdt;
  if (e.uT <= 0) {
    e.uT = rf(.4, 1);
    const hw = pathHW(e.f, e.bi, e.d), pu = (p.x - pathX(e.f, e.bi, e.d)) / hw;
    e.tu = rnd() < .35 ? clamp(pu, -.6, .6) : rf(-.62, .62);
  }
  e.u += clamp(e.tu - e.u, -1 * wdt, 1 * wdt);
  const ahead = e.d - p.d;
  if (e.state === 'go' && ahead > 26 && ahead < 90 && rnd() < .7 * wdt) { e.state = 'brake'; e.bt = .7; }
  if (e.state === 'brake') { e.vd = p.v - 30; e.bt -= wdt; if (e.bt <= 0) e.state = 'gone'; }
  else e.vd = p.v + (e.state === 'gone' ? 110 : 75);
  e.d += e.vd * wdt;
  if (e.cargo && e.drops < 3 && ahead > 14 && ahead < 160) {
    e.dropT = (e.dropT || .2) - wdt;
    if (e.dropT <= 0) { e.dropT = .3; e.drops++; addItem(e.cargo, e.d - 14, clamp(e.u + rf(-.25, .25), -.75, .75), e.f, e.bi, { z: 7, vz: 50, vu: (mr() - .5) }); }
  }
  if (ahead > PY + 70) e.dead = true;
}
function spawnTrucks(dt) {
  if ((G.truckT -= dt) > 0) return;
  G.truckT = Math.max(5.5, rf(10, 16) - G.k * .9);
  const p = G.p;
  const e = addEnt({ type: 'bluetruck', d: p.d - (H - PY) - 34, u: pick([-.6, .6]), w: 11, h: 23, f: p.f, bi: p.bi, state: 'warn', wt: 1.5, uT: 0, tu: 0, drops: 0,
    cargo: chance(.45) ? (REG[regionAt(p.d).id].cargo || pick(['gaolicai', 'xigua', 'fengli'])) : null });
  e.act = true;
  if (!G.demo) SFX.honk();
}
function spawnRescue(dt) {
  if (G.veh !== 'scooter' || !G.lost.length) return;
  if ((G.rescueT -= dt) > 0) return;
  const d = G.p.d + PY + 40;
  if (forkAt(d) || forkAt(d + 50) || forkAt(d - 50)) return;
  addEnt({ type: 'rescue', d, u: pick([-.74, .74]), w: 12, h: 12, who: G.lost[0] });
  G.rescueT = rf(28, 42);
}

/* ---------- abilities ---------- */
function useAbility() {
  if (!G || G.over || G.charge < 100) return;
  G.charge = 0;
  switch (G.lead) {
    case 'jeremy': G.drone = 7; break;
    case 'riley': G.storm.d -= 170; G.storm.freeze = 3; G.storm.glitch = 3.4; if (!G.demo) SFX.glitch(); break;
    case 'caleb': G.cool = 6; G.shades = 0; break;
    case 'lauren': G.whimsy = 5; for (const e of G.ents) if (!e.dead && e.act && SOLID[e.type]) whimsyPop(e); if (!G.demo) SFX.sparkle(); break;
    case 'rachel': G.kung = 2.6; G.p.iT = Math.max(G.p.iT, .2); break;
  }
  if (!G.demo) SFX.ability();
}
function whimsyPop(e) {
  e.dead = true;
  const n = { bus: 5, gravel: 5, bluetruck: 5, rubble: 3 }[e.type] || 1;
  const x = entX(e), r = regionAt(e.d);
  for (let i = 0; i < n; i++) {
    const hw = pathHW(e.f, e.bi, e.d);
    addItem(pickSnack(r, .2), e.d + (i - n / 2) * 10, clamp(e.u + (mr() - .5) * .5, -.8, .8), e.f, e.bi, { z: 4, vz: 80 + mr() * 40 });
    void hw;
  }
  for (let i = 0; i < 6; i++) G.parts.push({ kind: 'sparkle', x: x + (mr() - .5) * 16, d: e.d + (mr() - .5) * 16, vx: 0, vd: 0, z: 0, vz: 20, life: .6 + mr() * .3 });
}

/* ---------- typhoon ---------- */
function updateStorm(dt, wdt) {
  const s = G.storm, p = G.p, k = Math.min(G.k, 10);
  const rear = G.squad[G.squad.length - 1];
  const rearD = rear.d - VEH[G.veh].hh;
  const gap = rearD - s.d;
  let v = 84 + 6 * k;
  if (gap > 480) v += (gap - 480) * .3;
  if (G.inStorm) v *= 1.25;
  if (s.munch > 0) { v *= .45; s.munch -= dt; }
  if (s.freeze > 0) { v = 0; s.freeze -= dt; }
  if (G.cool > 0) v *= .7;
  s.v = v;
  s.d += v * wdt;
  s.glitch = Math.max(0, s.glitch - dt);
  G.gap = gap;
  if (gap < 0) caught();
  // lightning
  if ((G.boltT -= dt) < 0) {
    G.boltT = rf(2.5, 6) * (gap < 120 ? .5 : 1);
    G.bolt = { x: mr() * W, t: .25 };
    if (!save.reduce) G.flash = Math.max(G.flash, .08);
    if (!G.demo) setTimeout(() => SFX.thunder(), 200 + Math.min(1500, gap * 4));
  }
  if (G.bolt && (G.bolt.t -= dt) < 0) G.bolt = null;
  if (!G.demo) AU.setWind(clamp(1 - gap / 380, 0, 1) * .8 + G.inStorm * .45);
}
function caught() {
  const p = G.p, s = G.storm;
  if (G.squad.length > 1) {
    const f = G.squad.pop();
    G.lost.push(f.id);
    G.stats.lostAt[f.id] = regionAt(p.d).id;
    s.d -= 80; s.munch = 2.2;
    G.rescueT = rf(26, 40);
    G.parts.push({ kind: 'blown', id: f.id, x: f.x, d: f.d, vx: (mr() - .5) * 60, vd: -30, z: 0, vz: 120, life: 1.6 });
    if (!G.demo) { SFX.lost(); toast(T('blown', [FRIENDS[f.id].name])); refreshCrew(); }
    return;
  }
  if (G.demo) { startDemo(); return; }
  G.over = true; G.overT = 0;
  G.caughtAt = regionAt(p.d).id;
  AU.setWind(.9);
  SFX.over();
  onGameOver();
}

/* ---------- particles ---------- */
function spark(x, d) { for (let i = 0; i < 3; i++) G.parts.push({ x, d, vx: (mr() - .5) * 50, vd: -20 - mr() * 40, z: 1, vz: 30, life: .25, col: PAL_HEX[mr() < .5 ? C.Y : C.w] }); }
function updateParts(dt) {
  for (const q of G.parts) { q.x += q.vx * dt; q.d += q.vd * dt; q.z += q.vz * dt; q.vz -= 200 * dt; if (q.z < 0) { q.z = 0; q.vz = 0; q.vx *= .5; } q.life -= dt; }
  for (const q of G.pops) q.t += dt;
  if (G.parts.length > 300) G.parts.splice(0, G.parts.length - 300);
}
function prune() {
  const lo = G.p.d - (H - PY) - 90;
  G.items = G.items.filter(i => !i.got && i.d > lo);
  G.ents = G.ents.filter(e => !e.dead && (e.d > lo || e.state === 'warn'));
  G.props = G.props.filter(q => q.d > lo - 40);
  G.overhead = G.overhead.filter(q => q.d > lo - 20);
  G.parts = G.parts.filter(q => q.life > 0);
  G.pops = G.pops.filter(q => q.t < .8);
  G.forks = G.forks.filter(f => f.d3 > G.p.d - 600);
}

/* ---------- autopilot (title screen demo) ---------- */
function botSteer(dt) {
  const p = G.p, skill = G.botSkill || .8;
  if ((G.botT = (G.botT || 0) - dt) > 0) return;
  G.botT = .05 + (1 - skill) * .15;
  let tx = pathX(p.f, p.bi, p.d + 30);
  const nf = G.forks.find(f => f.chosen < 0 && f.d0 > p.d - 90 && f.d0 < p.d + 240);
  if (nf) {
    if (nf.botPick == null) {
      let best = 0, bs = -1e9;
      nf.br.forEach((b, i) => { const sc = (b.level || 1) * 2 - (b.stormy ? (G.gap < 160 ? 6 : 1.5) : 0) - (b.twisty ? .8 : 0) + mr() * 2.5; if (sc > bs) { bs = sc; best = i; } });
      nf.botPick = best;
    }
    tx = pathX(nf, nf.botPick, Math.max(p.d + 40, nf.d1));
  } else {
    let bestIt = null, bs = -1e9;
    for (const it of G.items) {
      if (it.got) continue;
      const dd = it.d - p.d;
      if (dd < 6 || dd > 150) continue;
      if ((it.f || p.f) && (it.f !== p.f || it.bi !== p.bi) && inFork(it.f || p.f, it.d)) continue;
      const x = itemX(it), dx = Math.abs(x - p.x);
      if (dx > dd * 1.5 + 8) continue;
      const sc = -dd * .5 - dx * .7 + TIER[SNACKS[it.id].t].pts * .15;
      if (sc > bs) { bs = sc; bestIt = x; }
    }
    if (bestIt != null) tx = bestIt;
  }
  // dodge
  for (const e of G.ents) {
    if (e.dead || !SOLID[e.type] || e.type === 'kicked') continue;
    const dd = e.d - p.d;
    if (dd < -14 || dd > 70 * skill + 20) continue;
    const ex = entX(e);
    if (Math.abs(ex - tx) < e.w / 2 + 9) tx = ex + (tx >= ex ? 1 : -1) * (e.w / 2 + 11);
  }
  p.tx = lerp(p.tx, tx + (mr() - .5) * (1 - skill) * 30, .6);
  if (G.charge >= 100 && (G.lead !== 'riley' || G.gap < 120)) useAbility();
}
</script>
