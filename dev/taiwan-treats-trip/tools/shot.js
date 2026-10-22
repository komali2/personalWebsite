// Headless smoke test + screenshots.  usage: node tools/shot.js [outdir] [--regions=N] [--veh=car|scooter] [--lead=id]
// Writes PNGs into outdir (default shots/) and prints console errors and run stats.
const { chromium } = require('./node_modules/playwright-core');
const path = require('path');
const fs = require('fs');
const DEV = path.dirname(__dirname);
const page = path.join(DEV, '..', '..', 'games', 'taiwan-treats-trip', 'index.html');
const arg = (k, d) => { const a = process.argv.find(s => s.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const out = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(DEV, 'shots'));
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, locale: arg('locale', 'en-US') });
  const errs = [];
  pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  pg.on('pageerror', e => errs.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await pg.addInitScript(() => localStorage.setItem('taiwan-treats-trip-v1', JSON.stringify({ mute: true })));
  await pg.goto('file://' + page);
  await pg.waitForTimeout(1800);
  await pg.screenshot({ path: path.join(out, '1_title.png') });
  await pg.click('#aboutBtn'); await pg.waitForTimeout(200);
  await pg.screenshot({ path: path.join(out, '1b_about.png') });
  await pg.click('#aboutBack'); await pg.waitForTimeout(200);
  await pg.click('#playBtn');
  await pg.evaluate(([v, l]) => { save.veh = v; save.lead = l; buildSelect(); }, [arg('veh', 'car'), arg('lead', 'caleb')]);
  await pg.waitForTimeout(300);
  await pg.screenshot({ path: path.join(out, '2_select.png') });
  await pg.click('#goBtn');
  await pg.evaluate(() => { G.bot = true; G.botSkill = .85; });
  await pg.waitForTimeout(3500);
  await pg.screenshot({ path: path.join(out, '3_play.png') });
  const regions = +arg('regions', 3);
  for (let i = 0; i < regions; i++) {
    // fast-forward until the next region, keeping the bot alive by holding the storm back
    const info = await pg.evaluate(() => {
      const k0 = G.regIdx; let n = 0;
      while (G.regIdx === k0 && n < 60 * 120 && !G.over) { update(1 / 60); if (G.gap < 120) G.storm.d -= 200; n++; }
      for (let j = 0; j < 60 * 12; j++) { update(1 / 60); if (G.gap < 120) G.storm.d -= 200; }
      return { region: G.route.join('>'), d: Math.round(G.p.d), score: G.score, snacks: G.stats.snacks, hits: G.stats.hits, items: G.items.length, ents: G.ents.length, props: G.props.length };
    });
    console.log('region', i + 1, JSON.stringify(info));
    await pg.waitForTimeout(400);
    await pg.screenshot({ path: path.join(out, `4_region${i + 1}.png`) });
  }
  // let the storm catch up for a storm shot, then force game over
  await pg.evaluate(() => { G.storm.d = G.p.d - 70; });
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: path.join(out, '5_storm.png') });
  await pg.evaluate(() => { G.squad.length = 1; G.storm.d = G.p.d + 50; });
  await pg.waitForTimeout(2600);
  await pg.screenshot({ path: path.join(out, '6_over.png'), fullPage: false });
  const perf = await pg.evaluate(() => { const t0 = performance.now(); for (let i = 0; i < 60; i++) render(); return ((performance.now() - t0) / 60).toFixed(2) + ' ms/render'; });
  console.log('perf', perf);
  console.log(errs.length ? 'ERRORS:\n' + [...new Set(errs)].slice(0, 20).join('\n') : 'no console errors');
  await b.close();
})().catch(e => { console.error('harness failed:', e.message); process.exit(1); });
