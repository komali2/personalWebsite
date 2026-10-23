// Headless smoke test + screenshots.  usage: node tools/shot.js [outdir] [--bug=beetle] [--locale=en-US]
// Drives every phase (fork, rush, fight, Auntie, win, death, log) and prints console errors.
const { chromium } = require('./node_modules/playwright-core');
const path = require('path');
const fs = require('fs');
const DEV = path.dirname(__dirname);
const page = path.join(DEV, '..', '..', 'games', 'taiwan-battle-bugs', 'index.html');
const arg = (k, d) => { const a = process.argv.find(s => s.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const out = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(DEV, 'shots'));
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, locale: arg('locale', 'en-US') });
  const errs = [];
  pg.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/ERR_INVALID_URL|ERR_FILE_NOT_FOUND/.test(m.text())) errs.push(m.type() + ': ' + m.text()); });
  pg.on('pageerror', e => errs.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await pg.addInitScript(() => localStorage.setItem('taiwan-battle-bugs-v1', JSON.stringify({ mute: true })));
  await pg.goto('file://' + page);
  const snap = async n => { await pg.screenshot({ path: path.join(out, n + '.png') }); };
  const ev = (fn, a) => pg.evaluate(fn, a);
  await pg.waitForTimeout(2200); await snap('01_title');
  await pg.click('#playBtn'); await ev(id => { save.bug = id; buildSelect(); }, arg('bug', 'beetle')); await pg.waitForTimeout(200); await snap('02_select');
  await pg.click('#goBtn'); await pg.waitForTimeout(1600);
  await ev(() => { G.pts = 2; G.fork.br[0].guard = { id: 'mirid', E: 2, elite: false, hidden: false }; G.fork.br[1].guard = { id: 'hornet', E: 6, elite: true, hidden: false }; });
  await pg.waitForTimeout(300); await snap('03_fork');
  await ev(() => choose(1)); await pg.waitForTimeout(280); await snap('04_rush');
  await pg.waitForTimeout(1400); await snap('05_fight');
  await ev(() => { G.B.me.sup = 100; playerAct('super'); }); await pg.waitForTimeout(350); await snap('06_super');
  await ev(() => { G.bot = true; }); await pg.waitForTimeout(9000);
  console.log('after fight', JSON.stringify(await ev(() => ({ phase: G.phase, hp: Math.round(G.hp), lv: G.lv, belly: G.belly, pts: G.pts, beaten: G.stats.beaten }))));
  await snap('07_after');
  // Auntie
  await ev(() => { G.bot = false; G.belly = BELLY; G.node = G.node || { stars: 1 }; setPhase('fIntro'); });
  await pg.waitForTimeout(1600); await snap('08_auntie_intro');
  await pg.waitForTimeout(2200); await snap('09_auntie_fight');
  await ev(() => { G.B.foe.wind = 0; G.B.foe.g = 1; G.B.foe.move = 'smack'; }); await pg.waitForTimeout(700); await snap('10_auntie_smack');
  await ev(() => { G.B.foe.hp = G.B.foe.max * .45; }); await pg.waitForTimeout(600); await snap('11_auntie_mad');
  await ev(() => { G.B.foe.hp = 1; G.bot = true; }); await pg.waitForTimeout(3600); await snap('12_auntie_out');
  await pg.waitForTimeout(3000); await snap('13_next_bush');
  // win: skip to the last bush and beat her
  await ev(() => { G.bush = 2; G.belly = BELLY; G.bot = false; setPhase('fIntro'); }); await pg.waitForTimeout(3200);
  await ev(() => { G.B.foe.hp = 1; G.bot = true; }); await pg.waitForTimeout(7000); await snap('14_win');
  // death
  await pg.click('#wAgainBtn'); await pg.waitForTimeout(1200);
  await ev(() => { G.fork.br[0].guard = { id: 'hornet', E: 30, elite: true, hidden: true }; choose(0); });
  await pg.waitForTimeout(1300); await snap('15_ambush');
  await ev(() => { G.B.me.hp = 1; }); await pg.waitForTimeout(6000); await snap('16_over');
  await pg.click('#menuBtn'); await pg.waitForTimeout(300);
  await pg.click('#logBtn'); await ev(() => logDetail('aunt')); await pg.waitForTimeout(200); await snap('17_log');
  const perf = await ev(() => { const t0 = performance.now(); for (let i = 0; i < 60; i++) render(); return ((performance.now() - t0) / 60).toFixed(2) + ' ms/render'; });
  console.log('perf', perf);
  console.log(errs.length ? 'ERRORS:\n' + [...new Set(errs)].slice(0, 20).join('\n') : 'no console errors');
  await b.close();
})().catch(e => { console.error('harness failed:', e.message); process.exit(1); });
