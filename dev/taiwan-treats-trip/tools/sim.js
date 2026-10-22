// Balance sim: bot plays seeded runs headlessly. usage: node tools/sim.js [runs=8] [skill=.8] [veh=car]
const { chromium } = require('./node_modules/playwright-core');
const path = require('path');
const page = path.join(path.dirname(__dirname), '..', '..', 'games', 'taiwan-treats-trip', 'index.html');
const [runs = 8, skill = .8, veh = 'car', lead = 'caleb'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/chromium' });
  const pg = await b.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + page); await pg.waitForTimeout(800);
  const res = await pg.evaluate(([runs, skill, veh, lead]) => {
    state = 'sim';
    const out = [];
    for (let s = 1; s <= runs; s++) {
      newRun({ seed: s * 7919, veh, lead }); G.bot = true; G.botSkill = skill;
      let t = 0, bel = 0, n = 0, lost = 0; const dt = 1 / 30;
      while (!G.over && t < 900) { update(dt); t += dt; bel += G.belly; n++; }
      out.push({ t: Math.round(t), reg: G.route.length, score: G.score, snacks: G.stats.snacks, hits: G.stats.hits, belly: Math.round(bel / n), lost: G.lost.length });
    }
    return out;
  }, [+runs, +skill, veh, lead]);
  res.forEach(r => console.log(JSON.stringify(r)));
  const avg = k => Math.round(res.reduce((a, r) => a + r[k], 0) / res.length);
  console.log(`AVG t=${avg('t')}s regions=${avg('reg')} score=${avg('score')} snacks=${avg('snacks')} hits=${avg('hits')} belly=${avg('belly')}`);
  if (errs.length) console.log('ERR', errs.slice(0, 5));
  await b.close();
})();
