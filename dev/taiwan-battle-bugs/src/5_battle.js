<script>
'use strict';
/* =========================================================================
   Combat: ATB-style gauges, real-time special cooldowns, supers, statuses.
   Enemy moves wind up (telegraphed) before they land; the player's land on tap.
   ========================================================================= */
const gaugeRate = f => Math.min(2, (.32 + f.spd * .022) * f.slowMul * f.spdMul * (f.rage ? 1.3 : 1));
const foeLv = f => Math.max(1, Math.round(1 + f.E / 2));

function mkFighter(o) {
  return Object.assign({ g: 0, wind: 0, move: null, cd: 0, sup: 0, slowMul: 1, slowT: 0, stun: 0, dots: [], stance: 0, evade: 0, shield: 0,
    spdMul: 1, queued: null, anim: null, animT: 9, flash: 0, isSuper: false, rage: false, takeK: 110 }, o);
}
function startBattle(kind) {
  const b = BUGS[G.bug];
  const me = mkFighter({ side: 'me', id: G.bug, max: G.st.hp, atk: G.st.atk, spa: G.st.spa, spd: G.st.spd, sp: b.sp, su: b.su, spCd: b.sp.cd });
  me.hp = G.hp; me.ref = me.max;
  if (G.bug === 'mantis') me.g = 1;
  let foe;
  if (kind === 'farmer') {
    const F = FARM[G.bush];
    foe = mkFighter({ side: 'foe', id: 'aunt', farmer: F, max: F.hp, atk: F.atk, spa: F.atk, spd: F.spd, su: { id: F.su }, E: 0, takeK: 30 });
    foe.ref = foe.max / 3;
  } else {
    const gd = G.node.guard, src = FOES[gd.id] || BUGS[gd.id], mul = BUGS[gd.id] ? .65 : 1;
    const s = k => src.base[k] * mul * (1 + FOE_K[k] * gd.E);
    foe = mkFighter({ side: 'foe', id: gd.id, max: Math.round(s('hp') * FOE_HP), atk: s('atk'), spa: s('spa'), spd: s('spd'), sp: src.sp, spCd: src.sp.cd,
      su: FOES[gd.id] && FOES[gd.id].su, E: gd.E, elite: gd.elite, takeK: gd.elite ? 70 : 0 });
    foe.ref = foe.max;
    foe.g = gd.hidden ? .6 : rf(0, .3); // ambushers get a head start
  }
  foe.hp = foe.max;
  G.B = { me, foe, kind, t: 0, sched: [], over: null, endT: 0 };
  pickMove(foe);
  // the beetle's Intimidate: enemy bugs sometimes freeze up, delaying their first move
  if (G.bug === 'beetle' && kind !== 'farmer' && chance(sizeOf(foe.id) < BUGS.beetle.size - 1 ? .6 : .3)) {
    foe.g = 0; foe.stun = 1.5; floatTxt(foe, T('scared'), C.Y); SFX.stance();
  }
}
function pickMove(f) {
  if (f.farmer) f.move = wpick(f.rage ? f.farmer.p2 : f.farmer.p1);
  else f.move = f.cd <= 0 && chance(.45) ? f.sp.id : 'basic';
}
// icon for the telegraph next to the enemy gauge
function telIcon(f) {
  if (f.isSuper) return 'ic_super';
  const m = MOVES[f.move];
  return f.move === 'basic' || (m && m.wind < .7) ? 'ic_fist' : 'ic_bang';
}

/* ---------- moves ---------- */
const MOVES = {
  basic: { wind: .3, run(f, o) { strike(f, o, f.atk); } },
  // enemy specials
  swarm: { wind: .6, run(f, o) { multi(3, .12, () => strike(f, o, f.atk * .5)); } },
  toxic: { wind: .6, run(f, o) { strike(f, o, f.atk * .6); dot(o, f.spa * .35, 5, f); } },
  hairs: { wind: .7, run(f, o) { dot(o, f.spa * .3, 5, f); slow(o, .7, 4); } },
  whip: { wind: .9, run(f, o) { strike(f, o, f.atk * 1.8, { big: 1 }); } },
  hide: { wind: .3, run(f, o) { f.shield = 2.5; healF(f, f.max * .1); } },
  crush: { wind: 1, run(f, o) { strike(f, o, f.atk * 2.2, { big: 1 }); } },
  // playable kits (enemies use them too)
  hornflip: { wind: .6, run(f, o) { strike(f, o, f.spa * 2, { big: 1 }); knock(o, .4); } },
  stance: { wind: .2, run(f, o) { f.stance = 2; } },
  spray: { wind: .6, run(f, o) { dot(o, f.spa * .5, 5, f, 'stink'); slow(o, .7, 5); } },
  hop: { wind: .2, run(f, o) { f.evade = 2; strike(f, o, f.spa * .6); } },
  web: { wind: .6, run(f, o) { strike(f, o, f.spa * 1.5); slow(o, .5, 5); } },
  // supers
  sumo: { run(f, o) { strike(f, o, (f.atk + f.spa) * 2.2, { sup: 1, big: 1 }); stunF(o, 2); } },
  cuts: { run(f, o) { multi(6, .09, () => strike(f, o, f.atk * .75, { sup: 1 })); } },
  bomb: { run(f, o) { stunF(o, 3); dot(o, f.spa * .8, 5, f, 'stink'); } },
  beauty: { run(f, o) { healF(f, f.max * .4); f.g = 1; f.spdMul = 1.3; } },
  cocoon: { run(f, o) { stunF(o, 4); dot(o, f.spa * 1.2, 4, f); } },
  venom: { wind: 1, run(f, o) { strike(f, o, f.atk * 1.5, { big: 1 }); dot(o, f.spa * .5, 6, f); } },
  // the farmer
  smack: { wind: 1.2, run(f, o) { strike(f, o, f.atk * 2.2, { big: 1 }); } },
  double: { wind: .45, run(f, o) { multi(2, .18, () => strike(f, o, f.atk * .8)); } },
  toss: { wind: .7, run(f, o) { strike(f, o, f.atk * 1.7, { big: 1 }); } },
  zap: { wind: .9, run(f, o) { if (strike(f, o, f.atk * 1.1)) { o.g = 0; stunF(o, .6); } } },
  sweep: { wind: .6, run(f, o) { strike(f, o, f.atk * 1.4); } },
  sparks: { wind: .5, run(f, o) { strike(f, o, f.atk * .3); dot(o, f.atk * .4, 5, f, 'zap'); } },
  overcharge: { wind: 1.3, run(f, o) { strike(f, o, f.atk * 2.6, { big: 1 }); } },
  mist: { wind: .8, run(f, o) { dot(o, f.atk * .55, 6, f, 'mist'); } },
  blast: { wind: .8, run(f, o) { strike(f, o, f.atk * 1.7, { big: 1 }); } },
  barrage: { wind: 1, run(f, o) { multi(5, .16, () => strike(f, o, f.atk * .8)); } },
  megazap: { wind: 1, run(f, o) { strike(f, o, f.atk * 2.6, { big: 1 }); o.g = 0; stunF(o, 1.5); } },
  fullspray: { wind: 1, run(f, o) { strike(f, o, f.atk * 1.6, { big: 1 }); dot(o, f.atk * .8, 6, f, 'mist'); } },
};
const ZAPS = new Set(['zap', 'sparks', 'overcharge', 'megazap']);
const SPRAYS = new Set(['mist', 'blast', 'fullspray']);

/* ---------- effects ---------- */
function multi(n, gap, fn) { for (let i = 0; i < n; i++) G.B.sched.push({ t: i * gap, fn }); }
function dot(o, dps, t, src, kind) { o.dots.push({ dps, t, src, acc: 0, kind: kind || 'dot' }); }
function slow(o, mul, t) { o.slowMul = Math.min(o.slowMul, mul); o.slowT = Math.max(o.slowT, t); }
function cancelWind(o, g) { if (o.wind > 0) { o.wind = 0; o.isSuper = false; o.g = g; return true; } return false; }
function stunF(o, t) { o.stun = Math.max(o.stun, t); if (cancelWind(o, 0)) floatTxt(o, T('stun'), C.Y); }
function knock(o, a) { if (!cancelWind(o, 1 - a)) o.g = Math.max(0, o.g - a); }
function healF(f, n) {
  const h = Math.round(Math.min(f.max - f.hp, n));
  f.hp += h;
  if (h > 0) { floatTxt(f, '+' + h, C.e); SFX.heal(); }
}
// a hit from f to o; returns damage dealt (0 if dodged or countered)
function strike(f, o, amt, opts = {}) {
  const B = G.B;
  if (!B || B.over) return 0;
  if (o.evade > 0 && !opts.dot) { o.evade = 0; floatTxt(o, T('miss'), C.c); SFX.miss(); dodgeFx(o); return 0; }
  if (o.stance > 0 && !opts.dot) {
    o.stance = 0; floatTxt(o, T('counter'), C.Y); counterFx(o);
    cancelWind(f, 0);
    strike(o, f, o.spa * 2.6, { big: 1 });
    return 0;
  }
  let d = opts.dot ? amt : amt * rf(.9, 1.1);
  if (o.shield > 0) d *= .25;
  d = Math.max(1, Math.round(d));
  o.hp = Math.max(0, o.hp - d);
  if (f.su && !opts.sup) f.sup = Math.min(100, f.sup + d / o.ref * 55);
  if (o.su) o.sup = Math.min(100, o.sup + d / o.ref * o.takeK);
  if (o.side === 'me') G.stats.dmgTaken = (G.stats.dmgTaken || 0) + d;
  hitFx(f, o, d, opts);
  if (o.hp <= 0) endBattle(o.side === 'foe' ? 'win' : 'lose', f);
  return d;
}
function endBattle(res, by) {
  const B = G.B;
  B.over = res; B.endT = 0;
  G.hp = Math.max(0, B.me.hp);
  if (res === 'lose') G.stats.killer = B.foe.farmer ? 'aunt' : B.foe.id;
  if (res === 'win') SFX.ko();
}

/* ---------- the loop ---------- */
function tick(f, o, dt) {
  for (const d of f.dots) {
    d.acc += d.dps * Math.min(dt, d.t); d.t -= dt;
    if (d.acc >= 1) { const n = Math.floor(d.acc); d.acc -= n; strike(d.src, f, n, { dot: 1, kind: d.kind }); if (G.B.over) return; }
  }
  if (f.dots.length) f.dots = f.dots.filter(d => d.t > 0);
  f.cd = Math.max(0, f.cd - dt);
  f.stance = Math.max(0, f.stance - dt); f.evade = Math.max(0, f.evade - dt); f.shield = Math.max(0, f.shield - dt);
  if (f.slowT > 0 && (f.slowT -= dt) <= 0) { f.slowT = 0; f.slowMul = 1; }
  f.flash = Math.max(0, f.flash - dt); f.animT += dt;
  if (f.stun > 0) { f.stun = Math.max(0, f.stun - dt); return; }
  if (f.wind > 0) { if ((f.wind -= dt) <= 0) resolve(f, o); return; }
  if (f.g < 1) f.g = Math.min(1, f.g + gaugeRate(f) * dt);
}
function resolve(f, o) {
  const m = f.move, sup = f.isSuper;
  f.wind = 0; f.isSuper = false; f.anim = 'atk'; f.animT = 0;
  moveFx(f, m);
  MOVES[m].run(f, o);
  if (!sup) { f.g = 0; if (f.sp && m === f.sp.id) f.cd = f.spCd; }
  if (!G.B.over) pickMove(f);
}
function battleStep(dt) {
  const B = G.B;
  B.t += dt;
  if (B.over) { B.endT += dt; tickAnims(B, dt); return; }
  for (let i = B.sched.length - 1; i >= 0; i--) {
    const s = B.sched[i];
    if ((s.t -= dt) <= 0) { B.sched.splice(i, 1); s.fn(); if (B.over) return; }
  }
  const me = B.me, f = B.foe;
  tick(me, f, dt); if (B.over) return;
  tick(f, me, dt); if (B.over) return;
  if (G.bot) botFight();
  if (me.queued && me.g >= 1) tryAct(me.queued);
  if (f.farmer && !f.rage && f.hp <= f.max / 2) { f.rage = true; if (!f.wind) pickMove(f); auntSay('half' + (G.bush + 1)); }
  if (f.stun <= 0 && f.wind <= 0) {
    if (f.su && f.sup >= 100) { f.sup = 0; f.move = f.su.id; f.isSuper = true; f.wind = MOVES[f.move].wind || 1; foeSuperFx(f); }
    else if (f.g >= 1) { f.wind = MOVES[f.move].wind; SFX.wind(); }
  }
}
function tickAnims(B, dt) { B.me.animT += dt; B.foe.animT += dt; B.me.flash = Math.max(0, B.me.flash - dt); B.foe.flash = Math.max(0, B.foe.flash - dt); }

/* ---------- player input ---------- */
function playerAct(kind) {
  const B = G.B;
  if (!B || B.over || G.phase !== 'fight') return;
  const me = B.me;
  if (kind === 'super') {
    if (me.sup < 100) return;
    me.sup = 0; me.anim = 'super'; me.animT = 0;
    startCutin(G.bug);
    MOVES[me.su.id].run(me, B.foe);
    return;
  }
  if (me.g >= 1 && me.stun <= 0 && (kind !== 'special' || me.cd <= 0)) tryAct(kind);
  else me.queued = me.queued === kind ? null : kind;
}
function tryAct(kind) {
  const B = G.B, me = B.me;
  if (me.stun > 0 || (kind === 'special' && me.cd > 0)) return;
  me.queued = null; me.g = 0; me.anim = kind; me.animT = 0;
  if (kind === 'basic') strike(me, B.foe, me.atk);
  else {
    moveFx(me, me.sp.id);
    MOVES[me.sp.id].run(me, B.foe);
    me.cd = me.spCd;
    if (me.sp.id === 'hop') me.g = .5;
  }
}
// autopilot for the demo and the balance sim
function botFight() {
  const B = G.B, me = B.me, o = B.foe;
  if (me.sup >= 100 && (o.wind > .2 || o.hp > me.atk * 1.5)) { playerAct('super'); return; }
  if (me.g < 1 || me.stun > 0) return;
  const id = me.sp.id;
  let k = 'basic';
  if (me.cd <= 0) {
    if (id === 'stance' || id === 'hop') { if (o.wind > .2 || (o.g > .85 && o.stun <= 0)) k = 'special'; }
    else if (id === 'hornflip') { if (o.wind > 0 || o.g > .5) k = 'special'; }
    else k = 'special';
  }
  playerAct(k);
}
</script>
