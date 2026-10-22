<script>
'use strict';
/* =========================================================================
   UI: screens, HUD, input, minimap, share, snack log, main loop
   ========================================================================= */
const $ = id => document.getElementById(id);
let state = 'boot', lastTs = 0, drag = null;
const SCREENS = ['title', 'select', 'pause', 'over', 'log', 'credits', 'aboutS'];
function show(id) { SCREENS.forEach(s => $(s).classList.toggle('on', s === id)); }
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 1800); }

function startDemo() {
  newRun({ demo: true, veh: Math.random() < .5 ? 'car' : 'scooter', lead: CREW[Math.random() * 5 | 0] });
  G.botSkill = .85;
}
function startGame() {
  AU.init();
  newRun({ veh: save.veh, lead: save.lead });
  G.prevBest = save.best;
  state = 'play';
  show(null);
  $('hud').classList.remove('hide');
  setupHUD();
  showBanner('taipei');
}
function toTitle() {
  state = 'title';
  $('hud').classList.add('hide');
  AU.setWind(0);
  startDemo();
  $('bestLine').textContent = save.best ? T('bestLine', [fmt(save.best)]) : '';
  show('title');
}

/* ---------- HUD ---------- */
const hc = {};
function setTxt(id, v) { if (hc[id] !== v) { hc[id] = v; $(id).textContent = v; } }
function setupHUD() {
  for (const k in hc) delete hc[k];
  $('bellyIco').src = sprURL('shuijiao');
  $('stormIco').src = sprURL('ico_storm');
  $('carIco').src = G.veh === 'car' ? sprURL('car', 'RRR') : sprURL('scooter', FRIENDS[G.lead].col + FRIENDS[G.lead].col2 + 'w');
  $('pauseIco').src = sprURL('ico_pause');
  $('abilityImg').src = sprURL('por_' + G.lead);
  refreshCrew();
}
function refreshCrew() {
  if (G.demo) return;
  $('crew').innerHTML = G.crew.filter(id => id !== G.lead).map(id => `<img class="px${G.lost.includes(id) ? ' lost' : ''}" src="${sprURL('por_' + id)}" alt="${FRIENDS[id].name}">`).join('');
}
function updateHUD() {
  setTxt('score', fmt(G.score));
  const m = comboMult();
  setTxt('combo', '×' + m);
  const cc = m > 1 ? '' : 'x1';
  if (hc.cc !== cc) { hc.cc = cc; $('combo').className = cc; }
  const b = Math.round(G.belly);
  if (hc.b !== b) { hc.b = b; const f = $('bellyFill'); f.style.width = b + '%'; f.classList.toggle('low', b < 25); }
  const gap = Math.max(0, G.gap || 0), sf = Math.round(clamp(1 - gap / 500, 0, 1) * 100);
  if (hc.sf !== sf) { hc.sf = sf; $('stormBar').firstElementChild.style.left = sf + '%'; }
  setTxt('stormTxt', T('hangryKm', [(gap / 100).toFixed(1)]));
  const ch = Math.round(G.charge);
  if (hc.ch !== ch) { hc.ch = ch; $('abilityBtn').style.setProperty('--p', ch + '%'); $('abilityBtn').classList.toggle('ready', ch >= 100); }
  const act = !!(G.drone || G.cool || G.whimsy || G.kung || G.storm.glitch);
  if (hc.act !== act) { hc.act = act; $('abilityBtn').classList.toggle('active', act); }
  if ((hc.mt = (hc.mt || 0) + 1) % 12 === 0) drawMinimap($('minimap'), false);
}
function showBanner(id) {
  const r = REG[id], b = $('banner');
  b.innerHTML = `<div class="en">${r.en.toUpperCase()}</div><div class="zh">${r.zh}</div><div class="sp">${r.spec.map(s => `<img class="px" src="${sprURL(s)}" alt="">`).join('')}</div>`;
  b.classList.add('on');
  clearTimeout(showBanner.h);
  showBanner.h = setTimeout(() => b.classList.remove('on'), 2600);
}

/* ---------- minimap & route map ---------- */
const MAPB = { lon0: 119.95, lon1: 122.1, lat0: 21.85, lat1: 25.35 };
const proj = (lon, lat, w, h) => [(lon - MAPB.lon0) / (MAPB.lon1 - MAPB.lon0) * w, (MAPB.lat1 - lat) / (MAPB.lat1 - MAPB.lat0) * h];
const islandCache = {};
function island(w, h) {
  const key = w + 'x' + h;
  if (islandCache[key]) return islandCache[key];
  const poly = TW_POLY.map(([lo, la]) => proj(lo, la, w, h));
  const inside = (x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const cnv = document.createElement('canvas'); cnv.width = w; cnv.height = h;
  const x = cnv.getContext('2d'), im = x.createImageData(w, h), u = new Uint32Array(im.data.buffer);
  const [ax, ay] = proj(121.62, 24.95, w, h), [bx, by] = proj(120.85, 22.3, w, h);
  const mask = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) mask[j * w + i] = inside(i + .5, j + .5) ? 1 : 0;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (!mask[j * w + i]) continue;
    const edge = !mask[j * w + i - 1] || !mask[j * w + i + 1] || !mask[(j - 1) * w + i] || !mask[(j + 1) * w + i];
    const t = clamp(((i - ax) * (bx - ax) + (j - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2), 0, 1);
    const md = Math.hypot(i - (ax + t * (bx - ax)), j - (ay + t * (by - ay)));
    u[j * w + i] = PAL32[edge ? C.e : md < w * .07 ? C.f : C.E];
  }
  x.putImageData(im, 0, 0);
  return islandCache[key] = cnv;
}
function routePos(w, h) {
  const pts = G.route.map(id => proj(REG[id].lon, REG[id].lat, w, h));
  const k = Math.min(G.regIdx, pts.length - 1), r = G.regions[k];
  const fr = clamp((G.p.d - r.d0) / ((isFinite(r.dEnd) ? r.dEnd : r.d0 + REGION_LEN) - r.d0), 0, 1);
  const pos = k === 0 ? pts[0] : [lerp(pts[k - 1][0], pts[k][0], fr), lerp(pts[k - 1][1], pts[k][1], fr)];
  return { pts, pos, k };
}
function line(x, a, b, col) {
  x.fillStyle = col;
  const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])));
  for (let i = 0; i <= n; i++) x.fillRect(Math.round(lerp(a[0], b[0], i / n) - .5), Math.round(lerp(a[1], b[1], i / n) - .5), 1, 1);
}
function drawMinimap(cnv, big) {
  if (!G) return;
  const w = cnv.width, h = cnv.height, x = cnv.getContext('2d');
  x.clearRect(0, 0, w, h);
  x.drawImage(island(w, h), 0, 0);
  if (big) for (const id in REG) { const [px, py] = proj(REG[id].lon, REG[id].lat, w, h); x.fillStyle = PAL_HEX[C.l]; x.fillRect(Math.round(px) - 1, Math.round(py) - 1, 2, 2); }
  const { pts, pos, k } = routePos(w, h);
  for (let i = 1; i <= k; i++) line(x, pts[i - 1], i === k ? pos : pts[i], PAL_HEX[C.Y]);
  if (big) line(x, pts[k], pos, PAL_HEX[C.Y]);
  x.fillStyle = PAL_HEX[C.w]; x.fillRect(Math.round(pts[0][0]) - 1, Math.round(pts[0][1]) - 1, 3, 3);
  const blink = big || ((performance.now() / 250 | 0) & 1);
  if (G.over || big) {
    const [px, py] = pos, s = spr('ico_storm');
    if (s) x.drawImage(s, Math.round(px - s.width / 2), Math.round(py - s.height / 2));
  } else if (blink) { x.fillStyle = PAL_HEX[C.R]; x.fillRect(Math.round(pos[0]) - 1, Math.round(pos[1]) - 1, 3, 3); }
}

/* ---------- game over ---------- */
function onGameOver() {
  if (G.demo) return;
  const key = G.veh + '-' + G.lead;
  G.newBest = G.score > (G.prevBest || 0);
  save.best = Math.max(save.best, G.score);
  save.bests[key] = Math.max(save.bests[key] || 0, G.score);
  save.runs++;
  persist();
}
function favOf(id) { const t = G.fTally[id]; let best = null, n = 0; for (const k in t) if (t[k] > n) { n = t[k]; best = k; } return [best, n]; }
const QUIPS = { jeremy: [['n', 'q_j1'], ['', 'q_j2'], ['', 'q_j3']], riley: [['n', 'q_r1'], ['', 'q_r2'], ['', 'q_r3']], caleb: [['', 'q_c1'], ['', 'q_c2'], ['n', 'q_c3']],
  lauren: [['', 'q_l1'], ['n', 'q_l2'], ['r', 'q_l3']], rachel: [['k', 'q_a1'], ['n', 'q_a2'], ['', 'q_a3']] };
function quipFor(id) {
  const [fav, n] = favOf(id);
  const o = { name: FRIENDS[id].name, n, k: G.stats.kicked, km: Math.max(1, Math.round(G.p.d / 100)),
    fav: fav ? (LANG === 'zh' ? SNACKS[fav].zh : SNACKS[fav].py + ' ' + SNACKS[fav].zh) : '' };
  if (G.lost.includes(id)) return T('q_lost', { ...o, region: rName(G.stats.lostAt[id]) });
  const ok = { '': true, n: n >= 2, k: G.stats.kicked > 0, r: G.stats.rare > 0 };
  const keys = QUIPS[id].filter(([c]) => ok[c]).map(q => q[1]);
  if (G.stats.hits >= 6) keys.push('q_hits');
  if (o.km > 150) keys.push('q_km');
  const fresh = keys.filter(k => !quipFor.used.has(k)), from = fresh.length ? fresh : keys;
  const k = from[Math.random() * from.length | 0];
  quipFor.used.add(k);
  return T(k, o);
}
quipFor.used = new Set();
function showOver() {
  state = 'over';
  $('hud').classList.add('hide');
  AU.setWind(.25);
  $('caughtAt').textContent = T('near', [rBoth(G.caughtAt)]);
  const rm = $('routeMap'); rm.width = 72; rm.height = 117; rm.style.width = '144px'; rm.style.height = '234px';
  drawMinimap(rm, true);
  $('routeTxt').textContent = G.route.map(rName).join(' → ') + ' 🌀';
  $('oScore').textContent = fmt(G.score);
  $('oSnacks').textContent = G.stats.snacks;
  $('oBest').textContent = fmt(save.best);
  $('newBest').classList.toggle('hide', !G.newBest);
  const ids = Object.keys(G.tally).filter(k => G.tally[k] > 0).sort((a, b) => G.tally[b] - G.tally[a]);
  $('tally').innerHTML = ids.length ? ids.map(k => `<span title="${sName(k)}"><img class="px" src="${sprURL(k)}" alt="${sName(k)}">×${G.tally[k]}</span>`).join('') : `<span class="dim">${T('nothing')}</span>`;
  quipFor.used.clear();
  $('quips').innerHTML = G.crew.map(id => `<div><img class="px" src="${sprURL('por_' + id)}" alt=""><span>${quipFor(id)}</span></div>`).join('');
  show('over');
  $('over').scrollTop = 0;
}
async function share() {
  const url = location.href.split(/[?#]/)[0];
  const txt = T('shareTxt', { route: G.route.map(rName).join(' → '), n: G.stats.snacks, score: fmt(G.score), combo: G.bestCombo, lead: FRIENDS[G.lead].name, veh: T(G.veh === 'car' ? 'vehCar' : 'vehScooter'), url });
  if (navigator.share) { try { await navigator.share({ text: txt }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(txt); toast(T('copiedChat')); }
  catch (e) {
    const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast(T('copied')); } catch (e2) { toast(T('noCopy')); }
    ta.remove();
  }
}

/* ---------- select screen ---------- */
function buildSelect() {
  const veh = [['car', T('hatch'), T('hatchD'), sprURL('car', 'RRR'), 42, 66],
    ['scooter', T('squad'), T('squadD'), sprURL('scooter', 'RfY'), 32, 56]];
  $('vehCards').innerHTML = veh.map(([id, n, d, src, w, h]) => `<button class="card${save.veh === id ? ' sel' : ''}" data-veh="${id}"><img class="px" src="${src}" width="${w}" height="${h}" alt=""><b>${n}</b><small>${d}</small></button>`).join('');
  $('leadCards').innerHTML = CREW.map(id => { const f = FRIENDS[id]; return `<button class="card${save.lead === id ? ' sel' : ''}" data-lead="${id}"><img class="px" src="${sprURL('por_' + id)}" width="48" height="48" alt=""><span><b>${f.name}</b><em>${fAbility(id)}</em><small>${fDesc(id)}</small></span></button>`; }).join('');
}

/* ---------- snack log ---------- */
function openLog() {
  const groups = [[T('everywhere'), COMMON.concat(['zhenzhu'])]];
  for (const id of ['taipei', 'taichung', 'wuling', 'jiufen', 'taroko', 'hualien', 'taitung', 'kaohsiung']) groups.push([rBoth(id), REG[id].spec]);
  groups.push([T('truckGroup'), ['gaolicai', 'xigua', 'fengli']]);
  let found = 0, total = 0;
  $('logGrid').innerHTML = groups.map(([name, ids]) => `<div class="rg">${name}</div>` + ids.map(id => {
    total++; const n = save.eaten[id] || 0; if (n) found++;
    return `<button data-snack="${id}"><img class="px" src="${sprURL(id, null, n ? '' : 'sil')}" alt=""><span>${n ? '×' + n : '?'}</span></button>`;
  }).join('')).join('');
  $('logCount').textContent = T('discovered', [found, total]);
  $('logDetail').classList.add('hide');
  state = 'log'; show('log'); $('log').scrollTop = 0;
}
function logDetail(id) {
  const s = SNACKS[id], n = save.eaten[id] || 0, el = $('logDetail');
  const reg = Object.keys(REG).find(r => REG[r].spec.includes(id));
  const where = s.t === 'c' ? T('whereC') : s.t === 'r' ? T('whereR') : s.t === 'g' ? T('whereG') : rName(reg);
  const hint = s.t === 's' ? T('notYetS', [rName(reg)]) : T('notYet' + s.t.toUpperCase());
  el.innerHTML = n
    ? `<img class="px" src="${sprURL(id)}" alt=""><div class="zh">${s.zh}</div><div>${s.py}</div><div class="dim">${s.en}</div><p style="margin:8px 0">${sDesc(id)}</p><div class="dim">${T('eatenFound', [n, where])}</div>`
    : `<img class="px" src="${sprURL(id, null, 'sil')}" alt=""><div class="zh">？？？</div><p style="margin:8px 0">${hint}</p>`;
  el.classList.remove('hide');
  $('log').scrollTop = 0;
}

/* ---------- toggles ---------- */
function syncToggles() {
  $('tglSound').querySelector('img').src = sprURL(save.mute ? 'ico_mute' : 'ico_sound');
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
  if (state === 'log') openLog();
  $('bestLine').textContent = save.best ? T('bestLine', [fmt(save.best)]) : '';
}

/* ---------- input ---------- */
function bindInput() {
  const fr = $('frame');
  fr.addEventListener('pointerdown', e => {
    if (state !== 'play' || e.target.closest('button')) return;
    drag = { id: e.pointerId, x: e.clientX };
    try { fr.setPointerCapture(e.pointerId); } catch (_) { }
  });
  fr.addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId || state !== 'play') return;
    const dx = e.clientX - drag.x; drag.x = e.clientX;
    G.p.tx += dx * dpr / scale * 1.15;
  });
  const end = e => { if (drag && drag.id === e.pointerId) drag = null; };
  fr.addEventListener('pointerup', end); fr.addEventListener('pointercancel', end);
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.l = 1;
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.r = 1;
    else if (e.key === ' ') { if (state === 'play') { useAbility(); e.preventDefault(); } }
    else if (e.key === 'Escape' || e.key === 'p') { if (state === 'play') pauseGame(); else if (state === 'pause') resumeGame(); }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.l = 0;
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.r = 0;
  });
  $('abilityBtn').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); useAbility(); });
  $('pauseBtn').addEventListener('click', () => { if (state === 'play') pauseGame(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') pauseGame(); });
  const click = (id, fn) => $(id).addEventListener('click', () => { AU.init(); SFX.ui(); fn(); });
  click('playBtn', () => { buildSelect(); state = 'select'; show('select'); });
  click('goBtn', startGame);
  click('logBtn', openLog);
  click('credBtn', () => { state = 'credits'; show('credits'); });
  click('aboutBtn', () => { state = 'about'; show('aboutS'); });
  click('aboutBack', toTitle);
  click('logBack', toTitle);
  click('credBack', toTitle);
  click('resumeBtn', resumeGame);
  click('quitBtn', toTitle);
  click('againBtn', startGame);
  click('menuBtn', toTitle);
  click('shareBtn', share);
  $('tglSound').addEventListener('click', toggleSound);
  $('tglMotion').addEventListener('click', toggleMotion);
  $('pSound').addEventListener('click', toggleSound);
  $('pMotion').addEventListener('click', toggleMotion);
  $('tglLang').addEventListener('click', toggleLang);
  $('pLang').addEventListener('click', toggleLang);
  $('vehCards').addEventListener('click', e => { const b = e.target.closest('[data-veh]'); if (!b) return; save.veh = b.dataset.veh; persist(); SFX.ui(); buildSelect(); });
  $('leadCards').addEventListener('click', e => { const b = e.target.closest('[data-lead]'); if (!b) return; save.lead = b.dataset.lead; persist(); SFX.ui(); buildSelect(); });
  $('logGrid').addEventListener('click', e => { const b = e.target.closest('[data-snack]'); if (b) logDetail(b.dataset.snack); });
}
function pauseGame() { state = 'pause'; drag = null; keys.l = keys.r = 0; AU.setWind(0); syncToggles(); show('pause'); }
function resumeGame() { state = 'play'; show(null); }

/* ---------- main loop ---------- */
function frame(ts) {
  const dt = Math.min(.05, Math.max(0, (ts - lastTs) / 1000));
  lastTs = ts;
  if (state === 'play') {
    update(dt);
    if (!G.over) updateHUD();
    else if (G.overT > 1.4 && !G.overShown) { G.overShown = true; showOver(); }
  } else if (state === 'over' || (G && G.demo && state !== 'pause')) update(dt);
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
