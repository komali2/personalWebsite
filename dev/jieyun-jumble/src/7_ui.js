<script>
'use strict';
/* =========================================================================
   UI: screens, HUD, input, stamp book, daily day, share, main loop
   ========================================================================= */
const $ = id => document.getElementById(id);
let state = 'boot', lastTs = 0;
const GEN_V = 1; // bump if the generator changes, so shared daily scores say which boards they came from
const SCREENS = ['title', 'pause', 'over', 'book', 'credits', 'aboutS'];
function show(id) { SCREENS.forEach(s => $(s).classList.toggle('on', s === id)); }
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2200); }
function banner(main, sub, sub2) {
  if (!G || G.demo) return;
  const b = $('banner');
  b.innerHTML = '<div class="big"></div>' + (sub ? '<div class="s"></div>' : '') + (sub2 ? '<div class="s2"></div>' : '');
  b.firstChild.textContent = main; if (sub) b.children[1].textContent = sub; if (sub2) b.children[2].textContent = sub2;
  b.classList.add('on');
  clearTimeout(banner.h); banner.h = setTimeout(() => b.classList.remove('on'), 1900);
}
// the message bubble above the buttons: hints, clash jokes, lost riders
function showMsg(main, cls, secs, sub) {
  if (!G || G.demo) return;
  const el = $('msg');
  el.className = 'on ' + (cls || '');
  el.innerHTML = '<div></div>' + (sub ? '<div class="sub"></div>' : '');
  el.firstChild.textContent = main; if (sub) el.lastChild.textContent = sub;
  el.firstChild.className = cls === 'lost' && /[一-鿿]/.test(main) ? 'tw' : '';
  clearTimeout(showMsg.h); showMsg.h = setTimeout(() => el.classList.remove('on'), (secs || 3) * 1000);
}

/* ---------- run lifecycle ---------- */
function startDemo() { newGame({ demo: true }); G.botSpeed = 0; }
function dailySeed(date) { return hashStr('jieyun-jumble-daily-v' + GEN_V + '-' + date); }
function startGame(o) {
  AU.init();
  newGame(o);
  save.runs++; persist();
  state = 'play';
  show(null);
  $('hud').classList.remove('hide');
  setupHUD();
  if (!o.snap) { banner(T('firstTrain'), G.R.daily ? T('dailyTag') + ' ' + G.R.daily : ''); }
  snapshotRun();
}
function toTitle() {
  state = 'title';
  $('hud').classList.add('hide'); $('msg').classList.remove('on');
  startDemo();
  const today = taipeiDate();
  $('bestLine').textContent = [save.best ? T('bestLine', [fmt(save.best)]) : '', save.daily.date === today && save.daily.best ? T('todayDone', [fmt(save.daily.best)]) : '',
    save.daily.streak > 1 ? T('streak', [save.daily.streak]) : ''].filter(Boolean).join(' · ');
  $('contBtn').classList.toggle('hide', !(save.run && save.run.v === 1));
  show('title');
}
function onRunEnd() {
  if (G.demo) { startDemo(); return; }
  const R = G.R;
  G.newBest = R.score > (save.best || 0);
  save.best = Math.max(save.best || 0, R.score);
  if (R.daily) {
    const d = save.daily;
    if (d.last !== R.daily) { d.streak = d.last === prevDay(R.daily) ? (d.streak || 0) + 1 : 1; d.last = R.daily; }
    if (d.date !== R.daily) { d.date = R.daily; d.best = 0; }
    d.best = Math.max(d.best || 0, R.score);
  }
  clearRun();
  persist();
  state = 'over';
  $('hud').classList.add('hide'); $('msg').classList.remove('on');
  showOver();
}
const prevDay = date => new Date(Date.parse(date + 'T12:00:00Z') - 864e5).toISOString().slice(0, 10);
function showOver() {
  const R = G.R, won = R.won;
  $('overTitle').textContent = won ? T('overWon') : T('overFull');
  $('overTitle').className = won ? 'won' : 'full';
  $('overSub').textContent = won ? T('overWonSub') : T('overFullSub', [clockStr(R.m)]);
  drawOverPic($('overPic'), won);
  $('overStats').innerHTML = [[T('score'), fmt(R.score)], [T('carried'), fmt(R.carried + R.seated)], [T('boards'), R.k], [T('clears'), R.clears],
    [T('lines'), sizeFor(R.k)], [T('best'), fmt(save.best)]].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
  $('newBest').classList.toggle('hide', !G.newBest);
  const bits = [];
  if (G.newStamps.length) bits.push(T('newStamps', [G.newStamps.map(stnName).join(LANG === 'zh' ? '、' : ', ')]));
  if (G.newLost) bits.push(T('newLost', [G.newLost]));
  if (R.gaveUp >= 1) bits.push(T('bikes', [Math.floor(R.gaveUp)]));
  $('overNew').textContent = bits.join(' · ');
  show('over'); $('over').scrollTop = 0;
}
function drawOverPic(cnv, won) {
  const w = 112, h = 56; cnv.width = w; cnv.height = h; cnv.style.width = w * 2 + 'px'; cnv.style.height = h * 2 + 'px';
  const x = cnv.getContext('2d'); x.imageSmoothingEnabled = false;
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, won ? '#100c1e' : '#3c2f6e'); g.addColorStop(1, won ? '#262b44' : '#e8605a');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  const im = spr('sky_city');
  if (im) { x.drawImage(im, -96, h - im.height); if (won) { x.globalAlpha = .7; x.drawImage(tinted('sky_city', '#141024', .62), -96, h - im.height); x.globalAlpha = 1; const li = spr('sky_lights'); if (li) x.drawImage(li, -96, h - im.height); } }
  if (!won) for (let i = 0; i < 40; i++) { const c = spr('c_' + (1 + i % 6), [SHIRT[i % SHIRT.length], PANTS[(i * 3) % PANTS.length]]); if (c) x.drawImage(c, (i * 29) % (w - 6), h - 11 - (i % 4) * 3); }
}
async function share() {
  const R = G.R, url = location.href.split(/[?#]/)[0];
  let line = R.won ? T('shareWon') : T('shareFull', { time: clockStr(R.m) });
  if (R.daily) line = T('shareDaily', { date: R.daily, v: GEN_V }) + '\n' + line;
  const txt = T('shareTxt', { line, carried: fmt(R.carried + R.seated), clears: R.clears, score: fmt(R.score), url });
  if (navigator.share) { try { await navigator.share({ text: txt }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(txt); toast(T('copiedChat')); }
  catch (e) {
    const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast(T('copied')); } catch (e2) { toast(T('noCopy')); }
    ta.remove();
  }
}

/* ---------- HUD ---------- */
const hc = {};
function setTxt(id, v) { if (hc[id] !== v) { hc[id] = v; $(id).textContent = v; } }
function setCls(el, cls, on) { const k = el.id + '.' + cls; if (hc[k] !== on) { hc[k] = on; el.classList.toggle(cls, on); } }
function setupHUD() {
  for (const k in hc) delete hc[k];
  $('pauseIco').src = sprURL('ic_pause'); $('clockIco').src = sprURL('ic_clock'); $('scoreIco').src = sprURL('ic_people');
  [['ruleRow', 'ic_row', 'ruleRow'], ['ruleCol', 'ic_col', 'ruleCol'], ['ruleLine', 'ic_line', 'ruleLine'], ['ruleSpace', 'ic_space', 'ruleSpace']]
    .forEach(([id, ic, k]) => { $(id).querySelector('img').src = sprURL(ic); $(id).querySelector('span').textContent = T(k); });
  $('undoBtn').querySelector('img').src = sprURL('ic_undo'); $('clearBtn').querySelector('img').src = sprURL('ic_clear'); $('hintBtn').querySelector('img').src = sprURL('ic_hint');
  setTxt('rush', T('rush')); setTxt('daily', T('dailyTag'));
}
function updateHUD() {
  const R = G.R;
  setTxt('clock', clockStr(R.m));
  setCls($('rush'), 'hide', !isRush(R.m));
  setCls($('daily'), 'hide', !R.daily);
  setTxt('score', fmt(R.score));
  const cl = G.clash, play = G.phase === 'play';
  [['ruleRow', 'row'], ['ruleCol', 'col'], ['ruleLine', 'line'], ['ruleSpace', 'touch']].forEach(([id, k]) => {
    setCls($(id), 'bad', !!(play && cl && cl.kinds[k])); setCls($(id), 'ok', !!(cl && cl.done[k] && !cl.kinds[k]));
  });
  const lv2 = !!(G.hint && G.hint.lv === 1);
  setCls($('hintBtn'), 'lv2', lv2);
  setTxt('hintLbl', T(lv2 ? 'hint2' : 'hint'));
  $('undoBtn').disabled = !play || !G.undo.length;
  $('hintBtn').disabled = !play;
}

/* ---------- stamp book ---------- */
// every station with the lines that stop there, in line order
function bookStations() {
  const seen = new Map();
  for (const n of [9, 8, 7, 6, 5]) {
    const L = layoutFor(n);
    L.ids.forEach((id, l) => L.stn[l].forEach(st => { if (!seen.has(st)) seen.set(st, new Set()); seen.get(st).add(id); }));
  }
  const groups = LINE_IDS.map(id => ({ id, list: [] }));
  for (const [st, lines] of seen) groups[LINE_IDS.indexOf([...lines].sort((a, b) => LINE_IDS.indexOf(a) - LINE_IDS.indexOf(b))[0])].list.push({ st, lines: [...lines] });
  return groups;
}
const stampCache = new Map();
function stampURL(st, lines, got) {
  const key = st + got;
  if (stampCache.has(key)) return stampCache.get(key);
  const c = document.createElement('canvas'); c.width = 32; c.height = 32;
  const x = c.getContext('2d'), col = got ? LINES[lines[0]].col : '#5a6988';
  // a rubber stamp: double ring in the line's color, the landmark in the middle
  x.fillStyle = got ? '#fbf3e0' : '#262b44'; x.beginPath(); x.arc(16, 16, 15, 0, 7); x.fill();
  x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); x.arc(16, 16, 14, 0, 7); x.stroke();
  x.lineWidth = 1; if (!got) x.setLineDash([2, 2]); x.beginPath(); x.arc(16, 16, 11, 0, 7); x.stroke();
  if (got && lines[1]) { x.strokeStyle = LINES[lines[1]].col; x.beginPath(); x.arc(16, 16, 11, 0, Math.PI); x.stroke(); }
  const ic = spr((FACTS[st] && FACTS[st].icon) || 'st_train', null, false, got ? null : 'grey');
  if (ic) { x.globalAlpha = got ? 1 : .5; x.drawImage(ic, 8, 8); }
  // pixel-crisp: threshold the anti-aliased ring
  const d = x.getImageData(0, 0, 32, 32); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 100 ? 255 : 0; x.putImageData(d, 0, 0);
  const u = c.toDataURL(); stampCache.set(key, u); return u;
}
let bookTab = 'stn';
function openBook(tab) {
  bookTab = tab || bookTab;
  $('tabStn').classList.toggle('on', bookTab === 'stn'); $('tabLost').classList.toggle('on', bookTab === 'lost');
  const grid = $('bookGrid'); $('bookDetail').classList.add('hide');
  if (bookTab === 'stn') {
    const groups = bookStations(); let total = 0, got = 0, html = '';
    for (const g of groups) {
      if (!g.list.length) continue;
      html += `<div class="rg"><span class="lc" style="background:${LINES[g.id].col};color:${LINE_INK[g.id]}">${g.id}</span> ${lineName(g.id)}</div>`;
      for (const { st, lines } of g.list) {
        total++; const n = save.stamps[st] || 0; if (n) got++;
        html += `<button data-st="${st}" class="${n ? '' : 'no'}"><img class="px" src="${stampURL(st, lines, !!n)}" alt=""><span>${stnName(st)}</span></button>`;
      }
    }
    grid.innerHTML = html; $('bookCount').textContent = T('bookCount', [got, total]);
  } else {
    let got = 0;
    grid.innerHTML = LOST.map(l => { const n = save.found[l.id] || 0; if (n) got++; return `<button data-lost="${l.id}" class="${n ? '' : 'no'}"><img class="px" src="${sprURL(l.sprite, null, n ? null : 'sil')}" alt="" style="width:48px;height:48px;margin:8px"><span>${n ? N(l) : '？'}</span></button>`; }).join('');
    $('bookCount').textContent = T('lostCount', [got, LOST.length]);
  }
  state = 'book'; show('book'); $('book').scrollTop = 0;
}
function bookDetail(st) {
  const g = bookStations().flatMap(x => x.list).find(x => x.st === st), n = save.stamps[st] || 0, el = $('bookDetail'), f = FACTS[st];
  el.innerHTML = `<img class="px" src="${stampURL(st, g.lines, !!n)}" alt=""><div class="zh">${STN[st][1]}</div><div>${STN[st][0]}</div>`
    + `<div class="lines">${g.lines.map(id => `<span class="lc" style="background:${LINES[id].col};color:${LINE_INK[id]}">${id}</span>`).join('')}</div>`
    + (n ? `<p>${f ? N(f) : ''}</p><div class="dim">${T('visits', [n])}</div>` : `<p>${T('notYet')}</p>`);
  el.classList.remove('hide'); $('book').scrollTop = 0;
}
function lostDetail(id) {
  const l = lostOf(id), n = save.found[id] || 0, el = $('bookDetail');
  if (!n) { el.innerHTML = `<img class="px" src="${sprURL(l.sprite, null, 'sil')}" alt=""><p>${T('lostNot')}</p>`; }
  else {
    const say = k => l[k].tw ? `<p><span style="color:var(--Y)">${l[k].tw}</span><br><span class="dim">${l[k].tl}</span><br>${N(l[k])}</p>` : `<p>${N(l[k])}</p>`;
    el.innerHTML = `<img class="px" src="${sprURL(l.sprite)}" alt=""><div class="zh">${l.zh}</div><div>${l.en}</div>`
      + `<div class="lines"><span class="lc" style="background:${LINES[l.want].col};color:${LINE_INK[l.want]}">${l.want}</span> ${T('wants', [lineName(l.want)])}</div>`
      + say('ask') + say('thanks') + `<div class="dim">${T('lostMet', [n])}</div>`;
  }
  el.classList.remove('hide'); $('book').scrollTop = 0;
}

/* ---------- toggles ---------- */
function syncToggles() {
  $('frame').classList.toggle('calm', !!save.reduce);
  $('tglSound').querySelector('img').src = sprURL(save.mute ? 'ic_mute' : 'ic_sound');
  $('tglSound').classList.toggle('off', save.mute);
  $('tglMotion').classList.toggle('off', save.reduce);
  $('tglMotion').textContent = save.reduce ? '—' : '≈';
  $('pSound').textContent = T(save.mute ? 'soundOff' : 'soundOn');
  $('pMotion').textContent = T(save.reduce ? 'motionLow' : 'motionFull');
  $('pAuto').textContent = T(save.auto ? 'autoOn' : 'autoOff');
  $('tglLang').textContent = LANG === 'zh' ? 'EN' : '中';
  $('pLang').textContent = T('langSwitch');
}
function toggleSound() { AU.init(); AU.setMute(!save.mute); syncToggles(); }
function toggleMotion() { save.reduce = !save.reduce; persist(); syncToggles(); }
function toggleAuto() { save.auto = !save.auto; persist(); syncToggles(); }
function toggleLang() {
  LANG = LANG === 'zh' ? 'en' : 'zh'; save.lang = LANG; persist();
  applyLang(); syncToggles();
  if (G && !G.demo) setupHUD();
  if (state === 'book') openBook();
  if (state === 'title') toTitle();
}

/* ---------- input ---------- */
function canvasXY(e) {
  const r = $('game').getBoundingClientRect();
  return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
}
function bindInput() {
  const gm = $('game');
  gm.addEventListener('pointerdown', e => {
    if (state !== 'play' || !G || G.phase !== 'play') return;
    AU.init();
    const c = cellAt(...canvasXY(e));
    if (c < 0) return;
    G.drag = { c0: c, last: c, moved: false };
    try { gm.setPointerCapture(e.pointerId); } catch (er) { }
  });
  gm.addEventListener('pointermove', e => {
    if (!G || !G.drag || state !== 'play') return;
    const c = cellAt(...canvasXY(e));
    if (c < 0 || c === G.drag.last) return;
    if (!G.drag.moved) { G.drag.moved = true; paintCell(G.drag.c0, true); }
    paintCell(c, false); G.drag.last = c;
  });
  const up = () => {
    if (!G || !G.drag) return;
    const d = G.drag; G.drag = null;
    if (!d.moved) tapCell(d.c0); else endDrag();
  };
  gm.addEventListener('pointerup', up); gm.addEventListener('pointercancel', () => { if (G) { if (G.drag && G.drag.moved) endDrag(); G.drag = null; } });
  window.addEventListener('keydown', e => {
    if (state === 'play' && G && !G.demo) {
      if (e.key === 'z' || e.key === 'Z' || (e.key === 'z' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); undoMove(); }
      if (e.key === 'h' || e.key === 'H') hint();
    }
    if (e.key === 'Escape' || e.key === 'p') { if (state === 'play') pauseGame(); else if (state === 'pause') resumeGame(); }
  });
  const btn = (id, fn) => $(id).addEventListener('pointerdown', e => { e.preventDefault(); if (state !== 'play') return; AU.init(); fn(); });
  btn('undoBtn', undoMove); btn('clearBtn', clearMarks); btn('hintBtn', hint);
  $('pauseBtn').addEventListener('click', () => { if (state === 'play') pauseGame(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') pauseGame(); });
  const click = (id, fn) => $(id).addEventListener('click', () => { AU.init(); SFX.ui(); fn(); });
  click('playBtn', () => startGame({}));
  click('todayBtn', () => { const d = taipeiDate(); startGame({ seed: dailySeed(d), daily: d }); });
  click('contBtn', () => startGame({ snap: save.run }));
  click('bookBtn', () => openBook('stn'));
  click('tabStn', () => openBook('stn')); click('tabLost', () => openBook('lost'));
  click('credBtn', () => { state = 'credits'; show('credits'); });
  click('aboutBtn', () => { state = 'about'; show('aboutS'); });
  click('pRules', () => { state = 'aboutP'; show('aboutS'); });
  click('aboutBack', () => { if (state === 'aboutP') { state = 'pause'; show('pause'); } else toTitle(); });
  for (const b of ['bookBack', 'credBack', 'menuBtn']) click(b, toTitle);
  click('resumeBtn', resumeGame);
  click('quitBtn', () => { snapshotRun(); toTitle(); });
  click('againBtn', () => startGame(G && G.R.daily ? { seed: dailySeed(G.R.daily), daily: G.R.daily } : {}));
  click('shareBtn', share);
  $('tglSound').addEventListener('click', toggleSound); $('pSound').addEventListener('click', toggleSound);
  $('tglMotion').addEventListener('click', toggleMotion); $('pMotion').addEventListener('click', toggleMotion);
  $('tglLang').addEventListener('click', toggleLang); $('pLang').addEventListener('click', toggleLang);
  $('pAuto').addEventListener('click', toggleAuto);
  $('bookGrid').addEventListener('click', e => { const b = e.target.closest('[data-st],[data-lost]'); if (!b) return; SFX.ui(); if (b.dataset.st) bookDetail(b.dataset.st); else lostDetail(b.dataset.lost); });
}
function pauseGame() { state = 'pause'; snapshotRun(); syncToggles(); show('pause'); }
function resumeGame() { state = 'play'; show(null); }

/* ---------- main loop ---------- */
function frame(ts) {
  const dt = Math.min(.05, Math.max(0, (ts - lastTs) / 1000));
  lastTs = ts;
  // the real day only runs while you're playing (not paused, not reading the rules); the title demo always runs
  if (G && (state === 'play' || G.demo)) updateGame(dt);
  if (state === 'play' && G && !G.demo) updateHUD();
  render(state === 'pause' ? 0 : dt);
  requestAnimationFrame(frame);
}
async function boot() {
  setupCanvas();
  window.addEventListener('resize', resize);
  if (typeof FONT_B64 === 'string') {
    try { const ff = new FontFace('Cubic11', `url(data:font/woff2;base64,${FONT_B64})`); await ff.load(); document.fonts.add(ff); } catch (e) { console.warn('font', e); }
  }
  if (typeof LICENSE_TEXT === 'string') $('licText').textContent = LICENSE_TEXT;
  $('todayIco').src = sprURL('ic_today');
  bindInput();
  applyLang();
  syncToggles();
  toTitle();
  requestAnimationFrame(t => { lastTs = t; requestAnimationFrame(frame); });
}
window.addEventListener('load', boot);
</script>
