<script>
'use strict';
/* =========================================================================
   Rendering: low-res canvas (about 180+ px wide) scaled up by an integer
   factor. Top to bottom: sky + skyline, LED ticker, platform (crowd, train),
   the map board. DOM HUD sits over the top and bottom.
   ========================================================================= */
let W = 180, H = 360, cv, ctx, low, lctx, scale = 4, dpr = 1;
const LAY = {};
function setupCanvas() {
  cv = document.getElementById('game'); ctx = cv.getContext('2d');
  low = document.createElement('canvas'); lctx = low.getContext('2d');
  resize();
}
function resize() {
  const r = document.getElementById('frame').getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  const dw = Math.max(1, Math.round(r.width * dpr)), dh = Math.max(1, Math.round(r.height * dpr));
  scale = Math.max(2, Math.floor(dw / 180));
  W = Math.ceil(dw / scale); H = Math.ceil(dh / scale);
  cv.width = dw; cv.height = dh;
  low.width = W; low.height = H;
  // CSS px → logical px
  const k = dpr / scale, cs = getComputedStyle(document.documentElement);
  const st = parseFloat(cs.getPropertyValue('--st')) || 0, sb = parseFloat(cs.getPropertyValue('--sb')) || 0;
  const hudB = Math.ceil((st + 42) * k), botR = Math.ceil((sb + 112) * k);
  let skyB = Math.max(hudB + 24, 58), platH = 30;
  const fixed = () => skyB + 14 + platH + 5 + 4 + botR;
  const want = W - 8, slack = H - fixed() - want;
  if (slack < 0) skyB = Math.max(hudB + 4, skyB + slack);
  // tall phones: spend spare height on the skyline and the platform, not on empty margins
  else { const add = Math.min(slack, 60); skyB += Math.round(add * .55); platH += Math.round(add * .25); }
  LAY.skyB = skyB; LAY.tickY = skyB; LAY.platY = skyB + 14; LAY.platH = platH;
  const top = LAY.platY + LAY.platH + 5, bottom = H - botR - 4;
  LAY.boardTop = top; LAY.boardBot = bottom;
  skyCache.clear();
}
// board geometry for an n×n board
function geo(n) {
  const avail = Math.min(W - 8, LAY.boardBot - LAY.boardTop), cs = Math.max(8, Math.floor(avail / n)), S = cs * n;
  return { n, cs, S, x: Math.floor((W - S) / 2), y: LAY.boardTop + Math.max(0, Math.floor((LAY.boardBot - LAY.boardTop - S) / 2)) };
}
function cellAt(px, py) {
  if (!G) return -1;
  const g = geo(G.R.b.n), x = Math.floor((px - g.x) / g.cs), y = Math.floor((py - g.y) / g.cs);
  return x >= 0 && y >= 0 && x < g.n && y < g.n ? y * g.n + x : -1;
}

/* ---------- sprite helpers ---------- */
function dspr(id, x, y, s = 1, slots, alpha = 1, mode) {
  const im = spr(id, slots, false, mode);
  if (!im) { if (DEBUG) { lctx.fillStyle = '#f0f'; lctx.fillRect(x, y, 6, 6); } return null; }
  // alpha multiplies whatever fade is already active (line openings fade whole boards)
  const a0 = lctx.globalAlpha;
  if (alpha < 1) lctx.globalAlpha = a0 * Math.max(0, alpha);
  lctx.drawImage(im, Math.round(x), Math.round(y), im.width * s, im.height * s);
  lctx.globalAlpha = a0;
  return im;
}
const rect = (col, x, y, w, h) => { lctx.fillStyle = col; lctx.fillRect(Math.round(x), Math.round(y), w, h); };
const P = k => PAL_HEX[C[k]];

/* ---------- sky ---------- */
// sky keyframes by game minute after 06:00: [minute, top, horizon, darkness of the city 0..1, sunset glow 0..1]
const SKY = [[0, '#3a4466', '#f6757a', .45, .6], [50, '#4d8fd1', '#f8c49a', .1, .3], [110, '#2e8fd8', '#a6dcff', 0, 0], [600, '#2e8fd8', '#a6dcff', 0, 0],
  [690, '#5b4d9c', '#f79a52', .2, 1], [750, '#3c2f6e', '#e8605a', .5, .8], [800, '#1d1b3a', '#3a2f5e', .85, .1], [1080, '#100c1e', '#262b44', 1, 0]];
function skyAt(m) {
  for (let i = 1; i < SKY.length; i++) if (m <= SKY[i][0]) {
    const a = SKY[i - 1], b = SKY[i], t = (m - a[0]) / (b[0] - a[0]);
    return { top: mixHex(a[1], b[1], t), hor: mixHex(a[2], b[2], t), dark: lerp(a[3], b[3], t), glow: lerp(a[4], b[4], t) };
  }
  const l = SKY[SKY.length - 1]; return { top: l[1], hor: l[2], dark: l[3], glow: l[4] };
}
const skyCache = new Map();
function tinted(id, col, a) {
  const key = id + col + a;
  if (skyCache.has(key)) return skyCache.get(key);
  const im = spr(id); if (!im) return null;
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
  const x = c.getContext('2d'); x.drawImage(im, 0, 0);
  x.globalCompositeOperation = 'source-atop'; x.globalAlpha = a; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
  skyCache.set(key, c); return c;
}
function drawSky(m) {
  const s = skyAt(m), B = LAY.skyB;
  const gr = lctx.createLinearGradient(0, 0, 0, B);
  gr.addColorStop(0, s.top); gr.addColorStop(1, s.hor);
  lctx.fillStyle = gr; lctx.fillRect(0, 0, W, B);
  // sun by day, moon by night
  const day = clamp(m / 780, 0, 1), sx = W * (.1 + .8 * day), sy = B - 10 - Math.sin(day * Math.PI) * (B - 24);
  if (m < 790) { lctx.fillStyle = s.glow > .3 ? '#ffb15e' : '#fff3b0'; lctx.beginPath(); lctx.arc(Math.round(sx), Math.round(sy), 5, 0, 7); lctx.fill(); }
  else { const mx = W * .78, my = 14 + (m - 790) / 300 * 6; lctx.fillStyle = '#f4f0d8'; lctx.beginPath(); lctx.arc(mx, my, 4, 0, 7); lctx.fill(); lctx.fillStyle = s.top; lctx.beginPath(); lctx.arc(mx + 2, my - 1, 3.4, 0, 7); lctx.fill();
    for (let i = 0; i < 18; i++) { const x = (i * 47) % W, y = (i * 23) % Math.max(10, B - 30); if ((G ? G.t : 0) * 2 % 9 > i % 7) rect('#c0cbdc', x, y + 2, 1, 1); } }
  // skyline: day sprite, dusk and night tints laid over it, then the lights
  const im = spr('sky_city');
  if (im) {
    const x = Math.round((W - im.width) / 2), y = B - im.height;
    lctx.drawImage(im, x, y);
    if (s.glow > .02) { lctx.globalAlpha = s.glow * .55; lctx.drawImage(tinted('sky_city', '#b55088', .45), x, y); }
    if (s.dark > .02) { lctx.globalAlpha = s.dark; lctx.drawImage(tinted('sky_city', '#141024', .62), x, y); }
    lctx.globalAlpha = 1;
    const lights = clamp((s.dark - .25) * 1.6, 0, 1);
    if (lights > 0) { lctx.globalAlpha = lights; dspr('sky_lights', x, y); lctx.globalAlpha = 1; }
  }
}

/* ---------- LED ticker ---------- */
function tickerReset() {
  if (!G) return;
  const b = G.R.b, parts = [];
  b.lay.ids.forEach((id, l) => {
    const t = b.lay.tracks[l], [p] = moveTrain(t.length, b.pos[l], b.dir[l], 1), st = b.lay.stn[l][p];
    parts.push(`${id} ${TICKER.next.zh.replace('{stn}', STN[st][1])} ${TICKER.next.en.replace('{stn}', STN[st][0])}`);
  });
  G.tick.base = parts.join('   ◆   ') + '   ◆   ';
}
function tickerEvent(key, vars) {
  if (!G || G.demo) return;
  const f = s => s.replace(/\{(\w+)\}/g, (m, k) => vars && vars[k] !== undefined ? vars[k] : m);
  G.tick.over = { text: f(TICKER[key].zh) + '  ' + f(TICKER[key].en), t: 7, x: 0 };
}
function showStation(c) {
  if (!G || G.demo) return;
  const b = G.R.b, names = {};
  b.lay.tidx.forEach((a, l) => { if (a[c] >= 0) { const id = b.lay.stn[l][a[c]]; (names[id] = names[id] || []).push(b.lay.ids[l]); } });
  const txt = Object.keys(names).map(id => `${STN[id][1]} ${STN[id][0]} ${names[id].join('/')}`).join('   ');
  if (txt) G.tick.over = { text: txt, t: 3, x: 0, still: true };
}
function drawTicker(dt) {
  const y = LAY.tickY;
  rect(P('k'), 0, y, W, 14); rect('#1a1208', 1, y + 1, W - 2, 12);
  // LED dot grid
  lctx.fillStyle = 'rgba(255,170,40,.06)'; for (let x = 2; x < W - 2; x += 2) lctx.fillRect(x, y + 2, 1, 10);
  if (!G) return;
  const tk = G.tick;
  let txt = tk.base || '', still = false, x;
  if (tk.over) { tk.over.t -= dt; if (tk.over.t <= 0) tk.over = null; }
  if (tk.over) { txt = tk.over.text; still = tk.over.still; tk.over.x += dt * 26; }
  else tk.x += dt * 22;
  const im = textSpr(txt, 'y');
  lctx.save(); lctx.beginPath(); lctx.rect(2, y + 1, W - 4, 12); lctx.clip();
  if (still && im.width < W - 6) x = Math.round((W - im.width) / 2);
  else { const off = tk.over ? tk.over.x : tk.x, L = im.width + 30; x = Math.round(W - 4 - (off % L)); if (tk.over && off > im.width + W) tk.over = null; }
  lctx.drawImage(im, x, y - 1);
  if (!tk.over && x + im.width + 30 < W) lctx.drawImage(im, x + im.width + 30, y - 1);
  lctx.restore();
}

/* ---------- platform ---------- */
const SHIRT = ['R', 'B', 'e', 'o', 'q', 'Y', 'l', 'c', 's', 'E', 'M', 'w'], PANTS = ['b', 'n', 'N', 'u', 'k', 'g'];
function drawPlatform() {
  const y = LAY.platY, h = LAY.platH;
  rect(P('n'), 0, y, W, h);
  // wall tiles
  for (let x = 0; x < W; x += 8) rect(P('N'), x, y + 2, 1, 14);
  const door = spr('pf_door'), dw = door ? door.width : 24;
  // the train behind the screen doors, when it's in
  let trainX = null;
  if (G && G.old) {
    const t = G.pt, tb = G.phase === 'open' ? 1.0 : .8;
    const tin = easeOut((t - (tb - .6)) / .6), tout = easeIn((t - 1.9) / .8);
    trainX = W + 10 - tin * (W + 10) - tout * (W + 60);
  }
  if (trainX !== null) {
    const col = LINES[G.old.b.lay.ids[(G.R.k + 3) % G.old.b.n]].col;
    for (let i = -1; i < Math.ceil(W / 48) + 1; i++) dspr('pf_train', trainX + i * 50, y + 1, 1, [col]);
  }
  for (let x = 2; x < W; x += dw + 2) dspr('pf_door', x, y + 1, 1, null, trainX !== null ? .55 : 1);
  rect(P('G'), 0, y + h - 7, W, 7); rect(P('Y'), 0, y + h - 7, W, 1);
  // the crowd: person i always stands in the same spot, so the platform fills up rather than shuffling
  if (!G) return;
  const n = Math.floor(G.crowdShow), span = W - 26;
  for (let row = 2; row >= 0; row--) for (let i = 0; i < n; i++) {
    if ((i * 7) % 3 !== row) continue;
    const px = 3 + ((i * 37 + 11) % span), py = y + h - 13 - row * 2 + (G.phase === 'play' && (i + Math.floor(G.t * 2)) % 9 === 0 ? -1 : 0);
    dspr('c_' + (1 + i % 6), px, py, 1, [SHIRT[i % SHIRT.length], PANTS[(i * 3) % PANTS.length]]);
  }
  // people giving up on the crowd ride off on a shared bike
  for (const k of G.bikes) dspr('st_bike', k.x - k.t * 60, y + h - 18, 1, null, 1 - clamp((k.t - 1.6) / .6, 0, 1));
  // crowd gauge: people / capacity, red near 客滿
  const f = G.crowdShow / DAY.cap, gx = W - 21, gy = y + 3;
  rect(P('k'), gx - 1, gy - 1, 20, 9);
  const col = f >= .8 ? (Math.floor(G.t * 4) % 2 ? P('R') : P('r')) : f >= .5 ? P('y') : P('e');
  rect(P('n'), gx, gy + 6, 18, 1); rect(col, gx, gy + 6, Math.round(18 * clamp(f, 0, 1)), 1);
  drawDigits(lctx, String(Math.floor(G.crowdShow)), gx + 9, gy, f >= .8 ? P('R') : P('w'));
}

/* ---------- board ---------- */
// small helpers for the transition: region of a cell, where a train is
function floodTimes(oldB, newB) {
  const n = newB.n, out = new Float32Array(n * n), tr = newB.pos.map((p, l) => newB.lay.tracks[l][p]);
  let mx = 1; const d = [];
  for (let c = 0; c < n * n; c++) { d[c] = dist(n, tr[newB.reg[c]], c); if (d[c] > mx) mx = d[c]; }
  for (let c = 0; c < n * n; c++) out[c] = oldB.reg[c] === newB.reg[c] ? 0 : 1.0 + 1.1 * d[c] / mx;
  return out;
}
function trainPath(len, p0, d0, p1) {
  for (let s = 0; s <= 3; s++) {
    const path = [p0]; let p = p0, d = d0;
    for (let i = 0; i < s; i++) { [p, d] = moveTrain(len, p, d, 1); path.push(p); }
    if (p === p1) return path;
  }
  return [p0, p1];
}
function cellXY(g, c) { return [g.x + (c % g.n) * g.cs, g.y + Math.floor(c / g.n) * g.cs]; }
function drawBoard() {
  if (!G) return;
  const b = G.R.b, n = b.n, g = geo(n), cs = g.cs, t = G.pt;
  const dep = G.phase === 'depart' && G.old, opening = G.phase === 'open' && G.old;
  // during a line opening, the old board fades out, then the new one fades in
  if (opening && t < 1.7) { drawBoardOf(G.old.b, geo(G.old.b.n), { alpha: 1 - ss((t - 1.0) / .6), oldView: true }); return; }
  if (dep && !G.flood) G.flood = floodTimes(G.old.b, b);
  if (!dep) G.flood = null;
  drawBoardOf(b, g, { alpha: opening ? ss((t - 1.8) / .7) : 1, dep, zoom: opening ? 1 - .06 * (1 - ss((t - 1.8) / .7)) : 1 });
}
function drawBoardOf(b, g, o) {
  const n = b.n, cs = g.cs, N2 = n * n, t = G.pt, dep = o.dep, ov = o.oldView;
  lctx.globalAlpha = o.alpha;
  const regAt = c => dep && G.flood[c] && t < G.flood[c] ? G.old.b.reg[c] : b.reg[c];
  // frame
  rect(P('k'), g.x - 2, g.y - 2, g.S + 4, g.S + 4);
  rect('rgba(0,0,0,.25)', g.x + g.S + 2, g.y, 2, g.S + 2);
  // tints with a soft inner grid
  for (let c = 0; c < N2; c++) {
    const [x, y] = cellXY(g, c), id = b.lay.ids[regAt(c)], tint = TINT[id];
    rect(tint, x, y, cs, cs);
    rect(mixHex(tint, '#ffffff', .25), x, y, cs - 1, 1); rect(mixHex(tint, '#000000', .1), x, y + cs - 1, cs, 1); rect(mixHex(tint, '#000000', .1), x + cs - 1, y, 1, cs);
  }
  // conflict stripes
  if (!ov && G.clash && G.clash.any && G.phase === 'play') {
    lctx.save(); lctx.globalAlpha = o.alpha * .45; lctx.fillStyle = P('R');
    for (let c = 0; c < N2; c++) if (G.clash.stripe[c]) {
      const [x, y] = cellXY(g, c);
      lctx.save(); lctx.beginPath(); lctx.rect(x, y, cs, cs); lctx.clip();
      for (let k = -cs; k < cs; k += 4) { lctx.beginPath(); lctx.moveTo(x + k, y + cs); lctx.lineTo(x + k + cs, y); lctx.lineTo(x + k + cs + 1.5, y); lctx.lineTo(x + k + 1.5, y + cs); lctx.fill(); }
      lctx.restore();
    }
    lctx.restore(); lctx.globalAlpha = o.alpha;
  }
  // region borders (thick where the line changes)
  lctx.fillStyle = P('n');
  for (let c = 0; c < N2; c++) {
    const [x, y] = cellXY(g, c), cx = c % n, cy = (c / n) | 0, r = regAt(c);
    if (cx < n - 1 && regAt(c + 1) !== r) lctx.fillRect(x + cs - 1, y - 1, 2, cs + 2);
    if (cy < n - 1 && regAt(c + n) !== r) lctx.fillRect(x - 1, y + cs - 1, cs + 2, 2);
  }
  // tracks, then stations
  const ctr = c => { const [x, y] = cellXY(g, c); return [x + cs / 2, y + cs / 2]; };
  const lw = cs >= 26 ? 3 : 2;
  lctx.lineCap = 'round'; lctx.lineJoin = 'round';
  b.lay.tracks.forEach((tr, l) => {
    lctx.strokeStyle = LINES[b.lay.ids[l]].col; lctx.lineWidth = lw;
    lctx.beginPath(); tr.forEach((c, i) => { const [x, y] = ctr(c); if (i) lctx.lineTo(x, y); else lctx.moveTo(x, y); }); lctx.stroke();
  });
  const lines = new Uint8Array(N2); b.lay.tracks.forEach(tr => tr.forEach(c => lines[c]++));
  b.lay.tracks.forEach((tr, l) => tr.forEach(c => {
    const [x, y] = ctr(c), big = lines[c] > 1;
    if (big) { rect(P('k'), x - 3, y - 3, 6, 6); rect(P('w'), x - 2, y - 2, 4, 4); }
    else { rect(LINES[b.lay.ids[l]].col, x - 2, y - 2, 4, 4); rect(P('w'), x - 1, y - 1, 2, 2); }
  }));
  // trains: line-code badges riding the tracks (under the marks and commuters)
  b.lay.tracks.forEach((tr, l) => {
    let x, y;
    if (dep) {
      const path = trainPath(tr.length, G.old.b.pos[l], G.old.b.dir[l], b.pos[l]), f = ss((t - 1.0) / 1.2) * (path.length - 1);
      const i = Math.min(path.length - 2, Math.floor(f)), k = f - i;
      const [ax, ay] = ctr(tr[path[Math.max(0, i)]]), [bx, by] = ctr(tr[path[Math.min(path.length - 1, i + 1)]]);
      x = lerp(ax, bx, path.length > 1 ? k : 0); y = lerp(ay, by, path.length > 1 ? k : 0);
    } else [x, y] = ctr(tr[b.pos[l]]);
    drawTrain(b.lay.ids[l], x, y, cs);
  });
  // ✕ marks (and the faint auto-✕ helper): above the map, trains and stations
  const marks = ov ? G.old.marks : G.marks, mS = cs >= 30 ? 2 : 1;
  const xAlpha = dep ? 1 - ss(t / .5) : 1;
  const om = dep ? G.old.marks : marks;
  // each ✕ sits on a little plate of its block's color, so tracks, stations and train badges never show through it
  const trainCell = new Set(b.lay.tracks.map((tr, l) => tr[b.pos[l]]));
  for (let c = 0; c < N2; c++) if (om[c] === 1) {
    const [x, y] = cellXY(g, c), px = x + (cs - 7 * mS) / 2, py = y + (cs - 7 * mS) / 2;
    // on a train's block the plate also covers the whole badge
    const pw = Math.max(7 * mS + 2, !dep && trainCell.has(c) ? 13 : 0), ph = Math.max(7 * mS + 2, !dep && trainCell.has(c) ? 9 : 0);
    lctx.globalAlpha = o.alpha * xAlpha;
    rect(mixHex(TINT[b.lay.ids[regAt(c)]], '#ffffff', .3), Math.round(x + (cs - pw) / 2), Math.round(y + (cs - ph) / 2), pw, ph);
    lctx.globalAlpha = o.alpha;
    dspr('mk_x', px, py, mS, null, xAlpha);
  }
  if (!ov && !dep && save.auto && G.phase === 'play') {
    const att = new Uint8Array(N2);
    marks.forEach((v, c) => { if (v === 2) for (const d of G.B.seen[c]) att[d] = 1; });
    for (let c = 0; c < N2; c++) if (att[c] && !marks[c]) { const [x, y] = cellXY(g, c); dspr('mk_x', x + (cs - 7 * mS) / 2, y + (cs - 7 * mS) / 2, mS, null, o.alpha * .3); }
  }
  // commuters
  const rS = cs >= 34 ? 2 : 1, solvedNow = G.phase !== 'play' && !ov;
  const drawRider = (face, c, a, dy, mode, dx = 0) => {
    const [x, y] = cellXY(g, c), im = spr(face); if (!im) return;
    const px = x + (cs - im.width * rS) / 2 + dx, py = y + cs - im.height * rS - Math.max(1, (cs - im.height * rS) / 3) + dy;
    dspr(face, px, py, rS, null, a * o.alpha, mode);
    return [px, py, im.width * rS];
  };
  if (dep) {
    // last board's commuters: regulars stay, everyone else hops off to their train
    const keep = new Set(b.givens);
    for (let c = 0; c < N2; c++) if (G.old.marks[c] === 2 && !keep.has(c)) {
      const k = clamp((t - .6) / .6, 0, 1);
      drawRider(G.old.face[c], c, 1 - k, -Math.round(Math.sin(Math.min(1, t * 3) * Math.PI) * 3) - k * 6);
    }
    for (const c of b.givens) {
      const was = G.old.marks[c] === 2;
      drawRider(G.face[c], c, was ? 1 : ss((t - 2.2) / .6), was ? -Math.round(Math.abs(Math.sin(t * 6)) * (t < .6 ? 3 : 0)) : 0);
    }
  } else {
    for (let c = 0; c < N2; c++) if (marks[c] === 2) {
      const face = ov ? G.old.face[c] : G.face[c], bad = !ov && G.clash && G.clash.bad[c];
      const pop = G.pops.find(p => p.c === c), dy = pop ? -Math.round(Math.sin(pop.t / .4 * Math.PI) * 3) : 0;
      const jig = bad && !save.reduce ? Math.round(Math.sin(G.t * 30)) : 0;
      if (!ov && G.lock[c]) { const [x, y] = cellXY(g, c); rect(P('y'), x + 3, y + cs - 3, cs - 6, 1); }
      const r = drawRider(face, c, 1, dy + (solvedNow ? -Math.round(Math.abs(Math.sin(t * 8)) * 3) : 0), null, jig);
      if (!r) continue;
      if (bad) dspr(Math.floor(G.t * 3) % 2 ? 'fx_angry' : 'fx_sweat', r[0] + r[2] - 3, r[1] - 2, 1, null, o.alpha);
      // a lost rider bobs a "?"; once their own line's area reaches them, a heart
      if (!ov && G.R.lost && c === G.R.lost.cell) {
        const home = b.reg[c] === G.R.lost.line;
        dspr(home ? 'fx_heart' : 'fx_q', r[0] + r[2] / 2 - 2, r[1] - 8 + Math.round(Math.sin(G.t * (home ? 8 : 4))), 1, null, o.alpha);
      }
      if (G.byHint[c]) dspr('fx_star', r[0] - 2, r[1] - 2, 1, null, o.alpha * (.5 + .5 * Math.sin(G.t * 6)));
    }
  }
  // hint overlay
  if (!ov && G.hint && G.phase === 'play') drawHint(g);
  lctx.globalAlpha = 1;
}
function drawTrain(id, x, y, cs) {
  const w = id.length > 1 ? 11 : 7, h = 7, X = Math.round(x - w / 2), Y = Math.round(y - h / 2);
  rect(P('k'), X - 1, Y - 1, w + 2, h + 2);
  rect(LINES[id].col, X, Y, w, h);
  rect('rgba(255,255,255,.35)', X, Y, w, 1);
  drawDigits(lctx, id, x, Y + 1, LINE_INK[id]);
}
function drawHint(g) {
  const h = G.hint, cs = g.cs, pulse = .55 + .45 * Math.sin(G.t * 6);
  lctx.globalAlpha = pulse;
  for (const c of h.cells) { const [x, y] = cellXY(g, c); lctx.strokeStyle = P('Y'); lctx.lineWidth = 2; lctx.strokeRect(x + 1, y + 1, cs - 2, cs - 2); }
  for (const c of h.wrong) { const [x, y] = cellXY(g, c); lctx.strokeStyle = P('R'); lctx.lineWidth = 2; lctx.strokeRect(x + 1, y + 1, cs - 2, cs - 2); }
  lctx.globalAlpha = 1;
  const mS = cs >= 30 ? 2 : 1;
  for (const c of h.elim.concat(h.wrongX)) { const [x, y] = cellXY(g, c); dspr('mk_x2', x + (cs - 7 * mS) / 2, y + (cs - 7 * mS) / 2, mS, null, pulse); }
  if (h.place !== undefined && G.marks[h.place] !== 2) { const [x, y] = cellXY(g, h.place); dspr('fx_star', x + (cs - 7) / 2, y + (cs - 7) / 2, 1, null, pulse); }
}

/* ---------- frame ---------- */
function render(dt) {
  lctx.imageSmoothingEnabled = false;
  rect(P('k'), 0, 0, W, H);
  drawSky(G ? G.R.m : 600);
  drawTicker(dt || 0);
  drawPlatform();
  if (state !== 'pause') drawBoard();
  drawFx(dt || 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(low, 0, 0, W * scale, H * scale);
}
</script>
