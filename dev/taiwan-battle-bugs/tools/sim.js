// Balance sim: the autopilot plays seeded runs headlessly.  usage: node tools/sim.js [runs=10] [bug|all]
// Targets (PROGRESS.md): ~8 min to win, regular fights 8-15 s, farmer fights 30-60 s.
const { chromium } = require('./node_modules/playwright-core');
const path = require('path');
const page = path.join(path.dirname(__dirname), '..', '..', 'games', 'taiwan-battle-bugs', 'index.html');
const [runs = 10, which = 'all'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/chromium' });
  const pg = await b.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + page); await pg.waitForTimeout(800);
  const res = await pg.evaluate(([runs, which]) => {
    state = 'sim';
    const bugs = which === 'all' ? BUG_IDS : [which], out = {};
    for (const bug of bugs) {
      const rs = [];
      for (let s = 1; s <= runs; s++) {
        newRun({ seed: s * 7919 + bug.length, bug }); G.bot = true;
        let t = 0, fights = [], farm = [], last = null, ft = 0;
        const dt = 1 / 30;
        while (!G.over && t < 1800) {
          update(dt); t += dt;
          if (G.phase === 'fight' && G.B) { ft = G.B.t; last = G.B.kind; }
          else if (last) { (last === 'farmer' ? farm : fights).push(ft); last = null; }
        }
        rs.push({ won: G.won, t: Math.round(t), bush: G.bush + 1, lv: G.lv, beaten: G.stats.beaten, killer: G.stats.killer, fights: fights.length,
          fAvg: fights.length ? fights.reduce((a, b) => a + b, 0) / fights.length : 0, farm: farm.map(x => Math.round(x)) });
      }
      out[bug] = rs;
    }
    return out;
  }, [+runs, which]);
  for (const bug in res) {
    const rs = res[bug], n = rs.length, avg = k => (rs.reduce((a, r) => a + r[k], 0) / n);
    const kills = {}; rs.forEach(r => { if (r.killer) kills[r.killer + '@' + r.bush] = (kills[r.killer + '@' + r.bush] || 0) + 1; });
    console.log(`${bug.padEnd(7)} win ${Math.round(rs.filter(r => r.won).length / n * 100)}%  t=${Math.round(avg('t'))}s  lv=${avg('lv').toFixed(1)}  fights=${avg('fights').toFixed(1)} (${avg('fAvg').toFixed(1)}s avg)  farmer=${rs.map(r => r.farm.join('/')).join(' ')}  deaths=${JSON.stringify(kills)}`);
  }
  if (errs.length) console.log('ERR', errs.slice(0, 5));
  await b.close();
})();
