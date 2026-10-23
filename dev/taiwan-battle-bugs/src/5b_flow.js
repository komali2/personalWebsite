<script>
'use strict';
/* =========================================================================
   Run flow: fork → rush → arrive → (fight) → eat → next fork …
   a full belly → Auntie → leap to the next bush. Plus the autopilot.
   ========================================================================= */
const RUSH = () => save.reduce ? .32 : .5;
function setPhase(p) { G.phase = p; G.pt = 0; G.flag = 0; }

function choose(i) {
  if (!G || G.phase !== 'fork' || !G.fork.br[i]) return;
  G.sel = i;
  G.node = Object.assign({}, G.fork.br[i], { fought: false, elite: false });
  setPhase('rush');
  SFX.whoosh();
}
function arrive() {
  setPhase('arrive');
  G.bite = [];
  const gd = G.node.guard;
  if (gd) {
    seen(gd.id);
    if (gd.hidden && G.bug !== 'spider') { banner(T('ambush')); SFX.rustle(); shake(3); }
    else if (gd.elite) banner(T('elite'), NB(FOES.hornet));
  }
}
function seen(id) { if (!G.demo) save.seen[id] = (save.seen[id] || 0) + 1; }

// Auntie's speech bubble
function auntSay(key) {
  if (typeof AUNT === 'undefined' || !AUNT[key]) return;
  G.say = { key, t: 0 };
  if (!G.demo) save.heard[key] = 1;
  SFX.aunt();
  showBubble(AUNT[key]);
}

function update(dt) {
  if (!G) return;
  G.t += dt; G.pt += dt;
  if (G.say && (G.say.t += dt) > 2.8) { G.say = null; showBubble(null); }
  if (G.phase === 'fork' || G.phase === 'fight') G.stats.time += dt;
  updateFx(dt);
  switch (G.phase) {
    case 'fork':
      if (G.bot) { if (G.pts) botSpend(); if (G.pt > (G.demo ? 1 : .2)) choose(botPick()); }
      break;
    case 'rush':
      if (G.pt >= RUSH()) arrive();
      break;
    case 'arrive': {
      if (G.pt < .5) break;
      const gd = G.node.guard;
      if (!gd) { setPhase('eat'); break; }
      startBattle('bug'); setPhase('fight');
      break;
    }
    case 'fight': {
      battleStep(dt);
      const B = G.B;
      if (!B.over || B.endT < (B.over === 'win' ? 1 : 1.2)) break;
      if (B.over === 'lose') { if (B.foe.farmer) auntSay(['win', 'win2', 'win3'][G.bush]); setPhase('dead'); SFX.over(); break; }
      if (B.kind === 'farmer') {
        G.B = null; setPhase('fOut');
        G.hp = G.st.hp; gainPts(3); G.stats.farmers++; G.score += 500 * (G.bush + 1);
        auntSay('lose' + (G.bush + 1)); SFX.sigh();
        break;
      }
      const f = B.foe;
      G.node.fought = true; G.node.elite = !!f.elite;
      G.stats.beaten++; if (f.elite) G.stats.elites++;
      G.score += Math.round(20 + f.E * 5) * (f.elite ? 2 : 1);
      G.B = null;
      gainXP(foeXP(f));
      setPhase('eat');
      break;
    }
    case 'eat':
      if (G.flag < 3 && G.pt >= [.12, .34, .56][G.flag]) { addBite(G.flag); SFX.chomp(G.flag); G.flag++; }
      if (G.flag === 3 && G.pt >= .7) { G.flag = 4; eatLeaf(); }
      if (G.pt >= 1.05) {
        if (G.belly >= BELLY) { setPhase('fIntro'); SFX.rumble(); seen('aunt'); }
        else { newFork(); setPhase('next'); }
      }
      break;
    case 'next':
      if (G.pt >= .35) { setPhase('fork'); snapshotRun(); }
      break;
    case 'fIntro':
      if (G.pt < 1 && !save.reduce) shake(2.5);
      if (!G.flag && G.pt >= 1) { G.flag = 1; auntSay('intro' + (G.bush + 1)); banner(T('auntie'), NB(FARM[G.bush])); }
      if (G.pt >= (G.demo ? 2 : 2.8)) { startBattle('farmer'); setPhase('fight'); }
      break;
    case 'fOut':
      if (G.pt >= 2.8) {
        if (G.bush >= 2) { setPhase('won'); G.won = true; G.score += 2000; SFX.win(); }
        else { setPhase('jump'); SFX.jump(); }
      }
      break;
    case 'jump':
      if (!G.flag && G.pt >= .8) {
        G.flag = 1; G.bush++; G.belly = 0; newFork();
        banner(T('bushTitle', [G.bush + 1]), NB(BUSH_TOD[G.bush]));
      }
      if (G.pt >= 1.6) { setPhase('fork'); snapshotRun(); }
      break;
    case 'dead':
      if (G.pt >= 1.8 && !G.over) { G.over = true; onRunEnd(false); }
      break;
    case 'won':
      if (G.pt >= 1.4 && !G.over) { G.over = true; onRunEnd(true); }
      break;
  }
}

/* ---------- autopilot ---------- */
function botPick() {
  const hp = hpFrac();
  let best = 0, bv = -1e9;
  G.fork.br.forEach((b, i) => {
    let v = b.stars * 1.2 + rf(0, .6);
    const gd = b.guard;
    if (gd && (!gd.hidden || G.bug === 'spider')) v -= (hp < .4 ? 3.5 : hp < .65 ? 1.2 : -.4) * (gd.elite ? 2 : 1);
    if (v > bv) { bv = v; best = i; }
  });
  return best;
}
function botSpend() {
  const pref = BUGS[G.bug].pref;
  while (G.pts > 0) { const n = STATS.reduce((a, s) => a + G.spent[s], 0); allocate(pref[n % pref.length]); }
}
</script>
