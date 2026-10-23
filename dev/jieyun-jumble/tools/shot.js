// Headless smoke test + screenshots.  usage: node tools/shot.js [outdir] [--locale=en-US] [--w=390 --h=844]
// Drives the title demo, a real day (play by hand and by bot, clash, hints, solve → depart, line opening,
// lost riders, rush hour, platform full, last train), the stamp book and resume. Prints console errors.
const { chromium } = require('./node_modules/playwright-core');
const path = require('path');
const fs = require('fs');
const DEV = path.dirname(__dirname);
const page = process.argv.includes('--live') ? null : path.join(DEV, '..', '..', 'games', 'jieyun-jumble', 'index.html');
const arg = (k, d) => { const a = process.argv.find(s => s.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const out = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(DEV, 'shots'));
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const pg = await b.newPage({ viewport: { width: +arg('w', 390), height: +arg('h', 844) }, deviceScaleFactor: 1, hasTouch: true, locale: arg('locale', 'en-US') });
  const errs = [];
  pg.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/ERR_INVALID_URL|ERR_FILE_NOT_FOUND|net::/.test(m.text())) errs.push(m.type() + ': ' + m.text()); });
  pg.on('pageerror', e => errs.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await pg.addInitScript(m => localStorage.setItem('jieyun-jumble-v1', JSON.stringify({ mute: m })), !process.argv.includes('--sound'));
  await pg.goto(page ? 'file://' + page : 'https://www.calebjay.com/games/jieyun-jumble/');
  const snap = async n => { await pg.screenshot({ path: path.join(out, n + '.png') }); };
  const ev = (fn, a) => pg.evaluate(fn, a);
  const info = () => ev(() => ({ phase: G.phase, n: G.R.b.n, k: G.R.k, clock: clockStr(G.R.m), crowd: Math.round(G.R.crowd), score: G.R.score, lost: G.R.lost && G.R.lost.id }));
  await pg.waitForTimeout(3500); await snap('01_title');
  await pg.click('#playBtn'); await pg.waitForTimeout(1200); await snap('02_board');
  // tap a few blocks by hand: one ✕ and one commuter, then a clash
  const tapCell = async c => { const [x, y] = await ev(c => { const g = geo(G.R.b.n), r = $('game').getBoundingClientRect(); return [r.left + (g.x + (c % g.n + .5) * g.cs) / W * r.width, r.top + (g.y + (Math.floor(c / g.n) + .5) * g.cs) / H * r.height]; }, c); await pg.mouse.click(x, y); };
  const free = await ev(() => { const a = []; G.marks.forEach((v, c) => { if (!v) a.push(c); }); return a; });
  await tapCell(free[0]); await tapCell(free[1]); await tapCell(free[1]);
  await pg.waitForTimeout(200); await snap('03_marks');
  // force a clash: two commuters in one row
  await ev(() => { const n = G.R.b.n, row = []; for (let x = 0; x < n; x++) if (!G.lock[x]) row.push(x); setMarks([[row[0], 2], [row[row.length - 1], 2]]); });
  await pg.waitForTimeout(300); await snap('04_clash');
  await ev(() => clearMarks()); await pg.waitForTimeout(100);
  await pg.click('#hintBtn'); await pg.waitForTimeout(400); await snap('05_hint');
  await pg.click('#hintBtn'); await pg.waitForTimeout(400); await snap('06_hint2');
  // let the bot finish the board, catch the depart animation
  await ev(() => { G.bot = true; G.botSpeed = .05; });
  for (let i = 0; i < 60; i++) { if (await ev(() => G.phase !== 'play')) break; await pg.waitForTimeout(100); }
  await pg.waitForTimeout(700); await snap('07_depart');
  await pg.waitForTimeout(1300); await snap('08_flood');
  for (let i = 0; i < 40; i++) { if (await ev(() => G.phase === 'play')) break; await pg.waitForTimeout(100); }
  console.log('after board 1', JSON.stringify(await info()));
  // play on to a line opening
  for (let i = 0; i < 80; i++) { if (await ev(() => G.phase === 'open')) break; await pg.waitForTimeout(100); }
  await pg.waitForTimeout(1500); await snap('09_open');
  // jump ahead to 9x9 with rush hour on
  await ev(() => { G.bot = false; });
  for (let i = 0; i < 40; i++) { if (await ev(() => G.phase === 'play')) break; await pg.waitForTimeout(100); }
  await ev(() => { G.R.m = 680; G.R.k = 8; G.R.b = runIt(makeBoardIt(G.R.seed, 8, null, null)); setBoard(G.R.b, null); G.R.crowd = 40; });
  await pg.waitForTimeout(800); await snap('10_nine_rush');
  // a lost rider
  await ev(() => { const b = G.R.b; G.R.lost = spawnLost(b, rng32(5)) || { id: 'ama', cell: b.givens[0], line: 4, boards: 0 }; setBoard(b, null); lostSpeak('ask'); });
  await pg.waitForTimeout(500); await snap('11_lost');
  await ev(() => { G.bot = true; G.botSpeed = .03; });
  for (let i = 0; i < 6; i++) { for (let j = 0; j < 60; j++) { if (await ev(() => G.phase === 'play' && G.clash.count < 3)) break; await pg.waitForTimeout(100); } await pg.waitForTimeout(400); }
  console.log('after bot run', JSON.stringify(await info()));
  await snap('12_later');
  // pause hides the board; resume by snapshot
  await pg.click('#pauseBtn'); await pg.waitForTimeout(200); await snap('13_pause');
  await pg.click('#quitBtn'); await pg.waitForTimeout(600);
  await pg.click('#contBtn'); await pg.waitForTimeout(800); console.log('resumed', JSON.stringify(await info())); await snap('14_resumed');
  // platform full
  await ev(() => { G.bot = false; G.R.crowd = 59.9; }); await pg.waitForTimeout(3200); await snap('15_full');
  // stamp book
  await pg.click('#menuBtn'); await pg.waitForTimeout(300);
  await pg.click('#bookBtn'); await pg.waitForTimeout(300); await snap('16_book');
  await ev(() => bookDetail(Object.keys(save.stamps)[0])); await pg.waitForTimeout(200); await snap('17_stamp');
  await pg.click('#tabLost'); await pg.waitForTimeout(200); await snap('18_lost');
  await pg.click('#bookBack'); await pg.waitForTimeout(200);
  // last train
  await pg.click('#todayBtn'); await pg.waitForTimeout(600); await ev(() => { G.R.m = 1079; }); await pg.waitForTimeout(3000); await snap('19_last_train');
  const perf = await ev(() => { const t0 = performance.now(); for (let i = 0; i < 60; i++) render(0); return ((performance.now() - t0) / 60).toFixed(2) + ' ms/render'; });
  console.log('perf', perf);
  console.log(errs.length ? 'ERRORS:\n' + [...new Set(errs)].slice(0, 20).join('\n') : 'no console errors');
  await b.close();
})().catch(e => { console.error('harness failed:', e.message); process.exit(1); });
