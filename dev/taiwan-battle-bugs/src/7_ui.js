<script>
'use strict';
/* =========================================================================
   UI: screens, HUD, input, select, bug log, share, main loop
   ========================================================================= */
const $ = id => document.getElementById(id);
let state = 'boot', lastTs = 0;
const SCREENS = ['title', 'select', 'pause', 'over', 'win', 'log', 'credits', 'aboutS'];
function show(id) { SCREENS.forEach(s => $(s).classList.toggle('on', s === id)); }
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 1800); }
function banner(main, sub) {
  if (!G || G.demo || quiet()) return;
  const b = $('banner');
  b.innerHTML = `<div class="${/[一-鿿]/.test(main) && LANG === 'zh' ? 'zh' : 'en'}"></div>${sub ? '<div class="s"></div>' : ''}`;
  b.firstChild.textContent = main; if (sub) b.lastChild.textContent = sub;
  b.classList.add('on');
  clearTimeout(banner.h); banner.h = setTimeout(() => b.classList.remove('on'), 1500);
}
function showBubble(line) {
  if (!G || G.demo || quiet()) return;
  const el = $('bubble');
  if (!line) { el.classList.add('hide'); return; }
  $('bTw').textContent = line.tw; $('bSub').textContent = LANG === 'zh' ? line.zh : line.en;
  el.classList.remove('hide');
}

/* ---------- run lifecycle ---------- */
function startDemo() {
  newRun({ demo: true, bug: BUG_IDS[Math.random() * 5 | 0] });
}
function startGame(snap) {
  AU.init();
  newRun({ bug: snap ? snap.bug : save.bug, snap });
  seen(G.bug);
  save.runs++; persist();
  state = 'play';
  show(null);
  $('hud').classList.remove('hide');
  setupHUD();
  banner(T('bushTitle', [G.bush + 1]), NB(BUSH_TOD[G.bush]));
}
function toTitle() {
  state = 'title';
  $('hud').classList.add('hide'); $('bubble').classList.add('hide');
  startDemo();
  $('bestLine').textContent = save.best ? T('bestLine', [fmt(save.best)]) : '';
  $('contBtn').classList.toggle('hide', !(save.run && BUGS[save.run.bug]));
  show('title');
}
function onRunEnd(won) {
  if (G.demo) { startDemo(); return; }
  G.newBest = G.score > (save.best || 0);
  save.best = Math.max(save.best, G.score);
  if (won) save.wins[G.bug] = (save.wins[G.bug] || 0) + 1;
  clearRun();
  persist();
  state = won ? 'win' : 'over';
  $('hud').classList.add('hide'); $('bubble').classList.add('hide');
  if (won) showWin(); else showOver();
}
const statsHTML = () => [[T('score'), fmt(G.score)], [T('leaves'), G.stats.leaves + ' · ' + G.stats.stars + '★'], [T('beaten'), G.stats.beaten], [T('level'), G.lv],
  [T('time'), Math.floor(G.stats.time / 60) + ':' + String(Math.floor(G.stats.time % 60)).padStart(2, '0')], [T('best'), fmt(save.best)]]
  .map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
function picTo(cnv, id, s) {
  const im = spr(id); if (!im) return;
  cnv.width = im.width; cnv.height = im.height; cnv.style.width = im.width * s + 'px'; cnv.style.height = im.height * s + 'px';
  cnv.getContext('2d').drawImage(im, 0, 0);
}
function showOver() {
  const k = G.stats.killer || 'aphid';
  $('overWho').textContent = k === 'aunt' ? T('byAunt', [N(FARM[G.bush]), G.bush + 1]) : T('by', [N(who(k)), G.bush + 1]);
  picTo($('overPic'), k === 'aunt' ? 'au_mad' : 'fr_' + k, k === 'aunt' ? 3 : 3);
  $('overStats').innerHTML = statsHTML();
  $('newBest').classList.toggle('hide', !G.newBest);
  show('over'); $('over').scrollTop = 0;
}
function showWin() {
  picTo($('winPic'), 'win_' + G.bug, 4);
  $('winSub').textContent = T('winSub', [N(BUGS[G.bug])]);
  $('winStats').innerHTML = statsHTML();
  $('wNewBest').classList.toggle('hide', !G.newBest);
  show('win'); $('win').scrollTop = 0;
}
async function share() {
  const url = location.href.split(/[?#]/)[0];
  const line = G.won ? T('shareWin', { bug: N(BUGS[G.bug]) }) : T('shareLose', { bug: N(BUGS[G.bug]), bush: G.bush + 1 });
  const txt = T('shareTxt', { line, stars: G.stats.stars, beaten: G.stats.beaten, lv: G.lv, score: fmt(G.score), url });
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
function setW(id, v) { v = Math.round(clamp(v, 0, 1) * 1000) / 10; if (hc[id] !== v) { hc[id] = v; $(id).style.width = v + '%'; } }
function setCls(el, cls, on) { const k = el.id + '.' + cls; if (hc[k] !== on) { hc[k] = on; el.classList.toggle(cls, on); } }
function setupHUD() {
  for (const k in hc) delete hc[k];
  $('pauseIco').src = sprURL('ic_pause');
  $('bushPips').innerHTML = [0, 1, 2].map(() => `<img class="px" src="${sprURL('lf3')}" alt="">`).join('');
  $('bellyPips').innerHTML = Array.from({ length: BELLY }, () => `<img class="px" src="${sprURL('ic_leaf')}" alt="">`).join('');
  const b = BUGS[G.bug];
  [['aBasic', 'ic_atk', b.basic], ['aSpecial', 'ic_spa', b.sp], ['aSuper', 'ic_super', b.su]].forEach(([id, ic, mv]) => {
    $(id).querySelector('img').src = sprURL(ic); $(id).querySelector('span').textContent = N(mv);
  });
  buildTray();
}
function buildTray() {
  const b = BUGS[G.bug];
  $('trayBtns').innerHTML = STATS.map(s => `<button data-stat="${s}"><img class="px" src="${sprURL('ic_' + s)}" alt=""><span>${T(s)} <b data-v="${s}"></b></span><em>+${b.grow[s] % 1 ? b.grow[s].toFixed(1) : b.grow[s]}</em></button>`).join('');
  hc.tray = null;
}
const ST_IC = { stun: 'ic_ko', slow: 'ic_spd', dot: 'ic_spa', shield: 'ic_hp', stance: 'ic_atk', evade: 'ic_spd' };
function statusIcons(f) {
  const s = [];
  if (f.stun > 0) s.push('stun'); if (f.slowMul < 1) s.push('slow'); if (f.dots.length) s.push('dot');
  if (f.shield > 0) s.push('shield'); if (f.stance > 0) s.push('stance'); if (f.evade > 0) s.push('evade');
  return s.join(',');
}
function setStatus(id, f) {
  const k = statusIcons(f);
  if (hc[id] !== k) { hc[id] = k; $(id).innerHTML = k ? k.split(',').map(s => `<img class="px" src="${sprURL(ST_IC[s])}" alt="${s}">`).join('') : ''; }
}
function updateHUD() {
  const fight = G.phase === 'fight' && G.B, B = G.B;
  setTxt('bushLbl', T('bushLbl', [G.bush + 1, N(BUSH_TOD[G.bush])]));
  setTxt('climbLbl', T('climbLbl', [G.belly, BELLY]));
  if (hc.belly !== G.belly + '|' + G.bush) {
    hc.belly = G.belly + '|' + G.bush;
    [...$('bellyPips').children].forEach((im, i) => im.classList.toggle('off', i >= G.belly));
    [...$('bushPips').children].forEach((im, i) => im.classList.toggle('off', i > G.bush));
  }
  setTxt('lvl', T('lvl', [G.lv])); setW('xpFill', G.xp / xpNeed(G.lv)); setTxt('score', fmt(G.score));
  // you
  const me = fight ? B.me : null, hp = me ? me.hp : G.hp, max = me ? me.max : G.st.hp;
  setW('myHp', hp / max); setTxt('myHpT', Math.ceil(hp) + '/' + Math.round(max)); setCls($('myHpBar'), 'low', hp / max < .3);
  setCls($('myGBar'), 'hide', !fight); setCls($('acts'), 'hide', !fight);
  setCls($('foe'), 'hide', !fight);
  if (fight) {
    setW('myG', me.g); setCls($('myGBar'), 'full', me.g >= 1);
    setStatus('mySt', me);
    const bb = $('aBasic'), bs = $('aSpecial'), bu = $('aSuper');
    const p = (el, v) => { const k = el.id + 'p'; v = Math.round(v * 100); if (hc[k] !== v) { hc[k] = v; el.style.setProperty('--p', v + '%'); } };
    p(bb, me.g); p(bs, Math.min(me.g, 1 - me.cd / me.spCd)); p(bu, me.sup / 100);
    const can = me.g >= 1 && me.stun <= 0;
    setCls(bb, 'ready', can); setCls(bb, 'wait', !can); setCls(bb, 'queued', me.queued === 'basic');
    setCls(bs, 'ready', can && me.cd <= 0); setCls(bs, 'wait', !(can && me.cd <= 0)); setCls(bs, 'queued', me.queued === 'special');
    setCls(bu, 'ready', me.sup >= 100); setCls(bu, 'wait', me.sup < 100);
    // enemy
    const f = B.foe;
    setTxt('foeName', f.farmer ? NB(LOG.aunt || { en: 'Auntie A-Zhu', zh: '阿珠姨' }) + ' · ' + N(f.farmer) : NB(who(f.id)) + (f.elite ? ' ★' : ''));
    setTxt('foeLv', f.farmer ? T('patience') : 'Lv ' + foeLv(f));
    setW('foeHp', f.hp / f.max); setTxt('foeHpT', Math.ceil(f.hp) + '/' + f.max);
    setW('foeG', f.wind > 0 ? 1 : f.g); setCls($('foeG').parentNode, 'full', f.wind > 0);
    const tel = telIcon(f);
    if (hc.tel !== tel) { hc.tel = tel; $('foeTel').src = sprURL(tel); }
    setCls($('foeTel'), 'wind', f.wind > 0);
    setCls($('foeSuBar'), 'hide', !f.su); if (f.su) setW('foeSu', f.sup / 100);
    setStatus('foeSt', f);
  }
  // stat tray
  const tray = G.phase === 'fork' && G.pts > 0 && !G.demo;
  setCls($('tray'), 'hide', !tray);
  if (tray) {
    setTxt('trayHead', G.pts === 1 ? T('trayHead1') : T('trayHead', [G.pts]));
    const v = STATS.map(s => Math.round(G.st[s])).join(',');
    if (hc.tray !== v) { hc.tray = v; STATS.forEach(s => { $('trayBtns').querySelector(`[data-v="${s}"]`).textContent = Math.round(G.st[s]); }); }
  }
}

/* ---------- select screen ---------- */
const STAT_MAX = { hp: 70, atk: 12, spa: 12, spd: 18 };
function buildSelect() {
  $('bugCards').innerHTML = BUG_IDS.map(id => {
    const b = BUGS[id];
    const bars = STATS.map(s => `<img class="px" src="${sprURL('ic_' + s)}" alt="${T(s)}"><div class="bar"><i style="width:${Math.round(b.base[s] / STAT_MAX[s] * 100)}%"></i></div>`).join('');
    return `<button class="card${save.bug === id ? ' sel' : ''}" data-bug="${id}">
      ${save.wins[id] ? `<img class="px won" src="${sprURL('ic_douli')}" alt="won">` : ''}
      <div class="pic"><img class="px" src="${sprURL('fr_' + id)}" alt=""><div class="stl">${bars}</div></div>
      <span><b>${N(b)}</b><i>${LANG === 'zh' ? b.en : b.zh} · ${b.sci}</i>
      <small><em>${T('special')}: ${N(b.sp)}</em> ${D(b.sp)}</small>
      <small><em>${T('super')}: ${N(b.su)}</em> ${D(b.su)}</small>
      <small><em>${T('trait')}: ${N(b.tr)}</em> ${D(b.tr)}</small></span></button>`;
  }).join('');
}

/* ---------- bug log ---------- */
const LOG_GROUPS = () => [[T('players'), BUG_IDS], [T('pests'), FOE_IDS], [T('farmer'), ['aunt']]];
const logPic = id => id === 'aunt' ? 'au_face' : 'fr_' + id;
function openLog() {
  let found = 0, total = 0;
  $('logGrid').innerHTML = LOG_GROUPS().map(([name, ids]) => `<div class="rg">${name}</div>` + ids.map(id => {
    total++; const n = save.seen[id] || 0; if (n) found++;
    return `<button data-log="${id}"><img class="px" src="${sprURL(logPic(id), null, n ? '' : 'sil')}" alt=""><span>${n ? (LANG === 'zh' ? (LOG[id] || who(id)).zh : (LOG[id] || who(id)).en) : '?'}</span></button>`;
  }).join('')).join('');
  $('logCount').textContent = T('discovered', [found, total]);
  $('logDetail').classList.add('hide');
  state = 'log'; show('log'); $('log').scrollTop = 0;
}
function logDetail(id) {
  const L = (typeof LOG !== 'undefined' && LOG[id]) || {}, n = save.seen[id] || 0, el = $('logDetail');
  if (!n) { el.innerHTML = `<img class="px" src="${sprURL(logPic(id), null, 'sil')}" alt=""><div class="zh">？？？</div><p>${T('unknown')}</p>`; }
  else {
    let html = `<img class="px" src="${sprURL(logPic(id))}" alt=""><div class="zh">${L.zh || ''}</div><div>${L.en || ''}</div>`
      + (L.sci ? `<div class="dim"><i>${L.sci}</i></div>` : '') + `<div class="dim">${T('size')}: ${LANG === 'zh' ? L.size_zh : L.size_en}</div>`
      + `<p>${LANG === 'zh' ? L.fact_zh : L.fact_en}</p>`;
    if (BUGS[id]) html += `<div class="dim">${T('played', [save.wins[id] || 0])}</div>`;
    else html += `<div class="dim">${T('met', [n])}</div>`;
    if (id === 'aunt' && typeof AUNT !== 'undefined') {
      html += `<h3>${T('auntSays')}</h3><table>` + Object.keys(AUNT).map(k => save.heard[k]
        ? `<tr><td class="tw">${AUNT[k].tw}</td><td>${AUNT[k].tl}<br><span class="dim">${LANG === 'zh' ? AUNT[k].zh : AUNT[k].en}</span></td></tr>`
        : `<tr><td class="tw">？？？</td><td class="dim">${T('notHeard')}</td></tr>`).join('') + '</table>';
    }
    el.innerHTML = html;
  }
  el.classList.remove('hide');
  $('log').scrollTop = 0;
}

/* ---------- toggles ---------- */
function syncToggles() {
  $('tglSound').querySelector('img').src = sprURL(save.mute ? 'ic_mute' : 'ic_sound');
  $('tglSound').classList.toggle('off', save.mute);
  $('tglMotion').classList.toggle('off', save.reduce);
  $('tglMotion').textContent = save.reduce ? '—' : '≈';
  $('pSound').textContent = T(save.mute ? 'soundOff' : 'soundOn');
  $('pMotion').textContent = T(save.reduce ? 'motionLow' : 'motionFull');
  $('tglLang').textContent = LANG === 'zh' ? 'EN' : '中';
  $('pLang').textContent = T('langSwitch');
}
function toggleSound() { AU.init(); AU.setMute(!save.mute); syncToggles(); }
function toggleMotion() { save.reduce = !save.reduce; persist(); syncToggles(); }
function toggleLang() {
  LANG = LANG === 'zh' ? 'en' : 'zh'; save.lang = LANG; persist();
  applyLang(); syncToggles(); buildSelect();
  if (G && !G.demo) { setupHUD(); for (const k in hc) delete hc[k]; }
  if (state === 'log') openLog();
  $('bestLine').textContent = save.best ? T('bestLine', [fmt(save.best)]) : '';
}

/* ---------- input ---------- */
function canvasXY(e) {
  const r = $('game').getBoundingClientRect();
  return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
}
function branchAt(x, y) {
  if (!G || G.phase !== 'fork') return -1;
  let best = -1, bd = 1e9;
  G.fork.br.forEach((b, i) => { const [tx, ty] = tipXY(b); const d = Math.abs(tx - x) + Math.max(0, Math.abs(ty - y) - 40) * .5; if (d < bd) { bd = d; best = i; } });
  return y < H * .8 ? best : -1;
}
function bindInput() {
  const gm = $('game');
  let down = null;
  gm.addEventListener('pointerdown', e => { if (state !== 'play') return; AU.init(); down = { x: e.clientX, y: e.clientY, p: canvasXY(e) }; });
  gm.addEventListener('pointermove', e => { if (state === 'play' && e.pointerType === 'mouse') { const [x, y] = canvasXY(e); G.hover = branchAt(x, y); } });
  gm.addEventListener('pointerup', e => {
    if (state !== 'play' || !down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y, [x, y] = down.p;
    down = null;
    if (G.phase === 'fork') {
      const n = G.fork.br.length;
      if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) choose(dx < 0 ? 0 : n - 1);
      else if (dy < -30) choose(n === 3 ? 1 : branchAt(x, H * .3));
      else { const i = branchAt(x, y); if (i >= 0) choose(i); }
    } else if (G.phase === 'fIntro' && G.pt > 1.3) G.pt = 2.8;
  });
  window.addEventListener('keydown', e => {
    if (state === 'play') {
      if (G.phase === 'fork') {
        const n = G.fork.br.length;
        if (e.key === 'ArrowLeft') choose(0);
        else if (e.key === 'ArrowRight') choose(n - 1);
        else if (e.key === 'ArrowUp') choose(n === 3 ? 1 : 0);
      }
      if (e.key === '1') playerAct('basic'); else if (e.key === '2') playerAct('special'); else if (e.key === '3') playerAct('super');
      if (e.key === ' ' && G.phase === 'fIntro' && G.pt > 1.3) G.pt = 2.8;
    }
    if (e.key === 'Escape' || e.key === 'p') { if (state === 'play') pauseGame(); else if (state === 'pause') resumeGame(); }
  });
  for (const id of ['aBasic', 'aSpecial', 'aSuper']) $(id).addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); AU.init(); playerAct($(id).dataset.act); });
  $('trayBtns').addEventListener('pointerdown', e => { const b = e.target.closest('[data-stat]'); if (!b || state !== 'play') return; e.preventDefault(); if (allocate(b.dataset.stat)) { SFX.pick(); hc.tray = null; } });
  $('pauseBtn').addEventListener('click', () => { if (state === 'play') pauseGame(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') pauseGame(); });
  const click = (id, fn) => $(id).addEventListener('click', () => { AU.init(); SFX.ui(); fn(); });
  click('playBtn', () => { buildSelect(); state = 'select'; show('select'); });
  click('contBtn', () => startGame(save.run));
  click('goBtn', () => startGame(null));
  click('logBtn', openLog);
  click('credBtn', () => { state = 'credits'; show('credits'); });
  click('aboutBtn', () => { state = 'about'; show('aboutS'); });
  for (const b of ['aboutBack', 'logBack', 'credBack', 'menuBtn', 'wMenuBtn']) click(b, toTitle);
  click('resumeBtn', resumeGame);
  click('quitBtn', () => { snapshotRun(); toTitle(); });
  click('againBtn', () => startGame(null)); click('wAgainBtn', () => startGame(null));
  click('shareBtn', share); click('wShareBtn', share);
  $('tglSound').addEventListener('click', toggleSound); $('pSound').addEventListener('click', toggleSound);
  $('tglMotion').addEventListener('click', toggleMotion); $('pMotion').addEventListener('click', toggleMotion);
  $('tglLang').addEventListener('click', toggleLang); $('pLang').addEventListener('click', toggleLang);
  $('bugCards').addEventListener('click', e => { const b = e.target.closest('[data-bug]'); if (!b) return; save.bug = b.dataset.bug; persist(); SFX.ui(); buildSelect(); });
  $('logGrid').addEventListener('click', e => { const b = e.target.closest('[data-log]'); if (b) logDetail(b.dataset.log); });
}
function pauseGame() { state = 'pause'; snapshotRun(); syncToggles(); show('pause'); }
function resumeGame() { state = 'play'; show(null); }

/* ---------- main loop ---------- */
function frame(ts) {
  const dt = Math.min(.05, Math.max(0, (ts - lastTs) / 1000));
  lastTs = ts;
  if (state === 'play' || state === 'title' || state === 'select' || state === 'log' || state === 'credits' || state === 'about') {
    // a short hit-stop when a super's cut-in lands
    if (G && G.cutin && G.cutin.t < .14) G.cutin.t += dt;
    else update(dt);
    if (state === 'play' && G && !G.demo) updateHUD();
  }
  render();
  requestAnimationFrame(frame);
}
async function boot() {
  setupCanvas();
  window.addEventListener('resize', resize);
  if (typeof FONT_B64 === 'string') {
    try { const ff = new FontFace('Cubic11', `url(data:font/woff2;base64,${FONT_B64})`); await ff.load(); document.fonts.add(ff); } catch (e) { console.warn('font', e); }
  }
  if (typeof LICENSE_TEXT === 'string') $('licText').textContent = LICENSE_TEXT;
  bindInput();
  applyLang();
  syncToggles();
  toTitle();
  requestAnimationFrame(t => { lastTs = t; requestAnimationFrame(frame); });
}
window.addEventListener('load', boot);
</script>
