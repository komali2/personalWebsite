<script>
'use strict';
/* =========================================================================
   Rendering: low-res canvas (about 168 px wide) scaled up by an integer factor
   ========================================================================= */
let cv, ctx, low, lctx, img, buf, scale = 4, dpr = 1, stormCv, stormCtx, stormImg, stormBuf;
let camI = 0, pdI = 0;
function setupCanvas() {
  cv = document.getElementById('game'); ctx = cv.getContext('2d');
  low = document.createElement('canvas'); lctx = low.getContext('2d');
  stormCv = document.createElement('canvas'); stormCtx = stormCv.getContext('2d');
  resize();
}
function resize() {
  const r = document.getElementById('frame').getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  const dw = Math.max(1, Math.round(r.width * dpr)), dh = Math.max(1, Math.round(r.height * dpr));
  scale = Math.max(2, Math.round(dw / 168));
  W = Math.ceil(dw / scale); H = Math.ceil(dh / scale);
  PY = Math.round(H * .68);
  cv.width = dw; cv.height = dh;
  low.width = W; low.height = H; stormCv.width = W; stormCv.height = H;
  img = lctx.createImageData(W, H); buf = new Uint32Array(img.data.buffer);
  stormImg = stormCtx.createImageData(W, H); stormBuf = new Uint32Array(stormImg.data.buffer);
}
const SX = x => Math.round(x) - camI + (W >> 1);
const SY = d => PY - (Math.round(d) - pdI);

/* ---------- ground & roads, per pixel ---------- */
function roadPix(e, dx, d, wx, lanes) {
  if (e < 1) return C.G;
  if (e >= 2 && e < 3) return C.l;
  const ad = dx < 0 ? -dx : dx;
  if (lanes === 'y') { if (ad >= .5 && ad < 1.5) return C.y; }
  else if (ad < 1 && ((d >> 3) & 1)) return C.l;
  const h = hash2(wx, d);
  return h < .07 ? C.g : h > .96 ? C.n : C.N;
}
function lots(wx, d, green) {
  const bxI = Math.floor(wx / 26), byI = Math.floor(d / 30), lx = wx - bxI * 26, ly = d - byI * 30;
  if (lx < 3 || ly < 3) return C.n;
  const h = hash2(bxI, byI);
  if (green && h < .3) return hash2(wx, d) < .15 ? C.e : C.E;
  return h < .4 ? C.g : h < .75 ? C.N : C.G;
}
function forest(wx, d) {
  const n = hash2(wx >> 2, d >> 2), f = hash2(wx, d);
  return f < .1 ? C.E : n < .5 ? C.f : C.F;
}
function groundPix(st, zone, dist, wx, d, t) {
  switch (st) {
    case 0: case 1: { // city, boulevard
      if (dist < 2) return C.G;
      if (dist < 8) return ((wx & 3) === 0 || (d & 3) === 0) ? C.G : C.l;
      if (st === 1 && dist < 16) return hash2(wx, d) < .12 ? C.e : C.E;
      return lots(wx, d, st === 1);
    }
    case 2: { // mountain: forest uphill (left), terraces + cloud sea downhill (right)
      if (zone < 0 || zone === 0) return dist < 2 ? C.U : forest(wx, d);
      if (dist < 2) return (d & 7) < 2 ? C.g : C.l;
      if (dist > 74) { const c = hash2((wx + (t * 5 | 0)) >> 3, d >> 3); return c < .45 ? C.l : c < .8 ? C.G : C.w; }
      const band = Math.floor((d + wx * .35) / 5);
      if (band & 1) return C.U;
      return hash2(wx >> 1, band) < .55 ? C.e : C.E;
    }
    case 3: { // Jiufen hill town
      if (dist < 3) return (wx + d) % 5 === 0 ? C.g : C.G;
      if (zone > 0 && dist > 52) { const g = hash2(wx >> 1, (d + (t * 8 | 0)) >> 1); return g < .04 ? C.B : C.b; }
      const bxI = Math.floor(wx / 18), byI = Math.floor(d / 14), lx = wx - bxI * 18, ly = d - byI * 14;
      if (lx < 2 || ly < 2) return C.k;
      if (ly === 2 && hash2(bxI, byI) < .35) return C.r;
      return ly % 3 === 0 ? C.n : hash2(bxI, byI) < .5 ? C.N : C.g;
    }
    case 4: { // Taroko marble gorge with a turquoise river on the left
      if (zone < 0 && dist >= 16 && dist < 36) {
        if (dist < 17 || dist >= 35) return C.g;
        return hash2(wx, (d + (t * 50 | 0))) < .09 ? C.c : hash2(wx >> 2, d >> 3) < .2 ? C.c : C.B;
      }
      if (dist < 3) return C.G;
      const v = ((wx * 3 + d * 2) % 41 + 41) % 41;
      if (v < 2) return C.G;
      return hash2(wx, d) < .05 ? C.w : C.l;
    }
    case 5: { // Hualien coast: green hills left, Pacific right
      if (zone <= 0) return dist < 2 ? C.U : (hash2(wx >> 2, d >> 2) < .55 ? (hash2(wx, d) < .12 ? C.e : C.E) : C.f);
      if (dist < 3) return C.G;
      const s = 9 + 1.6 * Math.sin(d * .08 + t * 2);
      if (dist < s) return hash2(wx, d) < .15 ? C.t : C.T;
      if (dist < s + 2) return C.w;
      if (dist < s + 4) return C.c;
      if (hash2(wx >> 1, (d + (t * 10 | 0)) >> 1) < .03) return C.c;
      return dist < 34 ? C.B : C.b;
    }
    case 6: { // Taitung rice paddies
      if (dist < 2) return C.u;
      const bxI = Math.floor(wx / 24), byI = Math.floor(d / 16), lx = wx - bxI * 24, ly = d - byI * 16;
      if (lx < 1 || ly < 1) return C.u;
      if ((bxI & 3) === 0 && lx < 3) return C.B;
      if (hash2(bxI, byI) < .28) return ly & 1 ? C.y : C.o;
      return ly & 1 ? C.e : C.E;
    }
    case 7: { // Kaohsiung harbor: city left, docks + water right
      if (zone <= 0) return groundPix(0, zone, dist, wx, d, t);
      if (dist < 10) return dist < 2 ? C.G : ((d % 24) < 2 && dist > 7 ? C.k : C.G);
      return hash2(wx >> 1, (d + (t * 6 | 0)) >> 1) < .05 ? C.B : (dist < 30 ? C.b : C.N);
    }
  }
  return C.E;
}
function renderGround() {
  const x0 = camI - (W >> 1), t = G.t;
  for (let sy = 0; sy < H; sy++) {
    const d = pdI + PY - sy;
    roadsAt(d);
    const reg = regionAt(d);
    let def = REG[reg.id];
    if (reg.k > 0 && d - reg.d0 < 48 && hash2(sy * 7, d) * 48 > d - reg.d0) def = REG[G.regions[reg.k - 1].id];
    const st = def.st, lanes = def.lanes;
    let L = 1e9, R = -1e9;
    for (let i = 0; i < RN; i++) { const a = RD[i * 3] - RD[i * 3 + 1], b = RD[i * 3] + RD[i * 3 + 1]; if (a < L) L = a; if (b > R) R = b; }
    const row = sy * W;
    for (let x = 0; x < W; x++) {
      const wx = x + x0;
      let c = -1, storm = 0, near = 1e9;
      for (let i = 0; i < RN; i++) {
        const dx = wx - RD[i * 3], hw = RD[i * 3 + 1], ad = dx < 0 ? -dx : dx;
        if (ad <= hw) { c = roadPix(hw - ad, dx, d, wx, lanes); storm = RD[i * 3 + 2]; break; }
        if (ad - hw < near) near = ad - hw;
        if (RD[i * 3 + 2] && ad < hw + 14) storm = 1;
      }
      if (c < 0) {
        const zone = wx < L ? -1 : wx > R ? 1 : 0;
        c = groundPix(st, zone, zone < 0 ? L - wx : zone > 0 ? wx - R : near, wx, d, t);
      }
      if (storm) {
        c = DARK[c];
        if (((wx - d + (t * 120 | 0)) % 13 + 13) % 13 === 0 && (d & 1)) c = C.G;
      }
      buf[row + x] = PAL32[c];
    }
  }
  lctx.putImageData(img, 0, 0);
}

/* ---------- sprites ---------- */
function sprOr(id, fb) { return spr(id) ? id : fb; }
function dspr(id, x, y, slots, flip, mode) {
  const c = spr(id, slots, flip, mode);
  if (!c) { if (!DEBUG) return; lctx.fillStyle = '#ff00ff'; lctx.fillRect(Math.round(x) - 3, Math.round(y) - 3, 6, 6); return; }
  lctx.drawImage(c, Math.round(x - c.width / 2), Math.round(y - c.height / 2));
}
function dsprB(id, x, y, slots, flip) { // bottom anchored
  const c = spr(id, slots, flip);
  if (!c) { if (!DEBUG) return; lctx.fillStyle = '#ff00ff'; lctx.fillRect(Math.round(x) - 4, Math.round(y) - 8, 8, 8); return; }
  lctx.drawImage(c, Math.round(x - c.width / 2), Math.round(y - c.height));
}
function dsprRot(id, x, y, a, slots, flipY) {
  const c = spr(id, slots); if (!c) return;
  lctx.save(); lctx.translate(Math.round(x), Math.round(y)); if (a) lctx.rotate(a); if (flipY) lctx.scale(1, -1);
  lctx.drawImage(c, -Math.round(c.width / 2), -Math.round(c.height / 2)); lctx.restore();
}
function shadow(x, y, w) { lctx.fillStyle = 'rgba(24,20,37,.38)'; lctx.fillRect(Math.round(x - w / 2), Math.round(y), w, 2); lctx.fillRect(Math.round(x - w / 2 + 1), Math.round(y) + 2, w - 2, 1); }

const DRAW = [];
function render() {
  if (!G) return;
  camI = Math.round(G.camX); pdI = Math.round(G.p.d);
  lctx.imageSmoothingEnabled = false;
  renderGround();
  const p = G.p, top = p.d + PY + 50, bot = p.d - (H - PY) - 50, t = G.t;

  // snacks lying on the road
  for (const it of G.items) {
    if (it.got || it.d > top || it.d < bot) continue;
    const x = SX(itemX(it)), y = SY(it.d), tier = SNACKS[it.id].t;
    const bob = it.z > 0 ? 0 : Math.round(Math.sin(t * 4 + it.ph));
    shadow(x, y + 4, 8);
    if (tier === 'r') { lctx.fillStyle = (t * 6 | 0) & 1 ? PAL_HEX[C.Y] : PAL_HEX[C.o]; lctx.fillRect(x - 8, y - 8 - bob, 16, 16); lctx.fillStyle = PAL_HEX[C.k]; lctx.fillRect(x - 7, y - 7 - bob, 14, 14); }
    else if (tier === 's') { lctx.fillStyle = 'rgba(44,232,245,.35)'; lctx.fillRect(x - 7, y - 7 - bob, 14, 14); }
    dspr(it.id, x, y - bob - Math.round(it.z));
  }

  // y-sorted world objects
  DRAW.length = 0;
  for (const q of G.props) if (q.d < top + 70 && q.d > bot) DRAW.push(q);
  for (const e of G.ents) if (!e.dead && e.act && e.d < top + 40 && e.d > bot) DRAW.push(e);
  for (const s of G.squad) DRAW.push(s);
  DRAW.sort((a, b) => b.d - a.d);
  for (const o of DRAW) {
    if (o.type) drawEnt(o);
    else if (G.squad.includes(o)) drawVehicle(o);
    else dsprB(o.id, SX(o.x), SY(o.d), o.slots, o.flip);
  }

  drawOverhead(top, bot);
  drawParts();

  // weather: darkness and rain scale with storm proximity
  const prox = clamp(1 - (G.gap || 999) / 420, 0, 1);
  const dark = .32 * prox + G.inStorm * .12;
  if (dark > .01) { lctx.fillStyle = `rgba(24,20,37,${dark.toFixed(3)})`; lctx.fillRect(0, 0, W, H); }
  const nRain = Math.round(70 * prox + 90 * G.inStorm);
  if (nRain) {
    lctx.fillStyle = 'rgba(192,203,220,.55)';
    for (let i = 0; i < nRain; i++) {
      const x = ((hash2(i, 1) * W + t * 60) % W + W) % W, y = (hash2(i, 2) * H + t * (260 + hash2(i, 3) * 80)) % H;
      lctx.fillRect(x | 0, y | 0, 1, 3);
    }
  }
  if (G.cool > 0) { lctx.fillStyle = 'rgba(18,78,137,.18)'; lctx.fillRect(0, 0, W, H); }
  drawStorm();
  // blue truck warnings
  // blue truck incoming: big warning sign on the side it will come up, above the bottom HUD
  for (const e of G.ents) if (e.type === 'bluetruck' && e.state === 'warn') {
    const on = (t * 6 | 0) & 1, x = e.u < 0 ? 16 : W - 16, y = H - Math.round(104 * dpr / scale) - 14;
    const c = spr('ico_hazard');
    if (c) lctx.drawImage(c, x - 9, y - 9 - on, 18, 18);
    lctx.fillStyle = PAL_HEX[on ? C.Y : C.o];
    for (let i = 0; i < 4; i++) lctx.fillRect(x - 3 + i, y + 12 + i * 2, 7 - 2 * i, 2);
    const tr = spr('bluetruck');
    if (tr && on) { lctx.globalAlpha = .7; lctx.drawImage(tr, x - 4, y + 22, 7, 13); lctx.globalAlpha = 1; }
  }
  if (G.flash > 0 && !save.reduce) { lctx.fillStyle = `rgba(255,255,255,${Math.min(.5, G.flash * 3).toFixed(2)})`; lctx.fillRect(0, 0, W, H); }

  // blit
  let ox = 0, oy = 0;
  if (G.shake > 0 && !save.reduce) { ox = Math.round((mr() - .5) * 4) * scale; oy = Math.round((mr() - .5) * 4) * scale; }
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = PAL_HEX[0]; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(low, ox, oy, W * scale, H * scale);
}

function drawVehicle(s) {
  const p = G.p, t = G.t;
  if (p.iT > 0 && G.kung <= 0 && ((t * 12 | 0) & 1)) return;
  const x = SX(s.x), y = SY(s.d);
  const lean = s.lean || 0, spin = p.spin > 0 ? p.spin * 14 : 0;
  if (G.kung > 0) { lctx.globalAlpha = .35; for (let k = 1; k <= 2; k++) dspr(G.veh === 'car' ? 'car' : 'scooter', x, y + k * 7, G.veh === 'car' ? 'RRR' : null, false, 'white'); lctx.globalAlpha = 1; }
  if (G.veh === 'car') {
    shadow(x + 1, y + 9, 14);
    const id = lean < -.35 ? sprOr('car_l', 'car') : lean > .35 ? sprOr('car_r', 'car') : 'car';
    if (spin) dsprRot('car', x, y, spin, 'RRR'); else dspr(id, x, y, 'RRR');
  } else {
    const f = FRIENDS[s.id], slots = f.col + f.col2 + 'w';
    shadow(x + 1, y + 6, 7);
    const id = lean < -.35 ? sprOr('scooter_l', 'scooter') : lean > .35 ? sprOr('scooter_r', 'scooter') : 'scooter';
    if (spin) dsprRot('scooter', x, y, spin, slots); else dspr(id, x, y, slots);
  }
  if (G.cool > 0 && s === G.squad[0]) {
    const k = clamp((6 - G.cool) / .5, 0, 1);
    dspr('shades', x, y - 4 - Math.round((1 - k) * 40));
  }
}

function drawEnt(e) {
  const x = SX(entX(e)), y = SY(e.d), t = e.t;
  switch (e.type) {
    case 'npcscooter': shadow(x + 1, y + 5, 6); dspr(((t * 6 | 0) & 1) ? sprOr('npcscooter2', 'npcscooter') : 'npcscooter', x, y, e.slots); break;
    case 'dog': { const mv = e.cross || e.vu; shadow(x, y + 3, 9); dspr(mv && ((t * 8 | 0) & 1) ? sprOr('dog2', 'dog') : 'dog', x, y, null, (e.vu || 0) < 0); break; }
    case 'rock':
      if (e.fall < 0) break;
      if (e.fall < 1) { const k = e.fall; lctx.fillStyle = 'rgba(24,20,37,.5)'; const w = Math.round(3 + 6 * k); lctx.fillRect(x - (w >> 1), y + 2, w, 2); dspr('rock', x, y - Math.round((1 - k) * 70)); }
      else { shadow(x, y + 3, 9); dspr('rock', x, y); }
      break;
    case 'rubble': dspr('rubble', x, y); break;
    case 'cone': dspr('cone', x, y); break;
    case 'bus': shadow(x + 2, y + 16, 15); dsprRot('bus', x, y, 0, null, true); break;
    case 'gravel': shadow(x + 2, y + 14, 15); dspr('gravel', x, y); break;
    case 'tourist': dspr(((t * 5 | 0) & 1) ? sprOr('tourist2', 'tourist') : 'tourist', x, y, e.slots, e.vu < 0); break;
    case 'monkey':
      shadow(x, y + 4, 7);
      dspr(e.state === 'sit' ? 'monkey' : sprOr('monkey2', 'monkey'), x, y - Math.round(e.z || 0), null, e.u > 0);
      if (e.carry) dspr(e.carry, x, y - 9);
      break;
    case 'bluetruck':
      if (e.state === 'warn') break;
      shadow(x + 2, y + 11, 13);
      dspr('bluetruck', x, y);
      if (e.cargo && e.drops < 3) { const c = spr(e.cargo); if (c) lctx.drawImage(c, 0, 0, c.width, c.height, x - 4, y + 1, 8, 8); }
      if (e.state === 'brake') { lctx.fillStyle = PAL_HEX[C.p]; lctx.fillRect(x - 6, y + 11, 2, 1); lctx.fillRect(x + 4, y + 11, 2, 1); }
      break;
    case 'kicked': {
      const id = { npcscooter: 'npcscooter', bus: 'bus', gravel: 'gravel', bluetruck: 'bluetruck', tourist: 'tourist' }[e.kid] || e.kid;
      dsprRot(id, x + e.kx, y - e.kz, e.t * 14, e.slots);
      break;
    }
    case 'rescue': {
      const bob = Math.round(Math.abs(Math.sin(G.t * 5)) * 2);
      lctx.fillStyle = PAL_HEX[C.g]; lctx.fillRect(x + 6, y - 14, 1, 16);
      lctx.fillStyle = PAL_HEX[C.B]; lctx.fillRect(x + 4, y - 16, 6, 4);
      lctx.fillStyle = PAL_HEX[C.w]; lctx.fillRect(x - 10, y - 22 - bob, 18, 18);
      lctx.fillStyle = PAL_HEX[C.k]; lctx.fillRect(x - 9, y - 21 - bob, 16, 16);
      dspr('por_' + e.who, x - 1, y - 13 - bob);
      if ((G.t * 4 | 0) & 1) drawDigits(lctx, '!', x + 10, y - 26, PAL_HEX[C.Y], true);
      break;
    }
  }
}

/* ---------- overhead: signs, arches, lanterns, balloons, drone ---------- */
const SIGN_NAME = { taipei: 'Taipei', taichung: 'Taichung', wuling: 'Wuling', jiufen: 'Jiufen', taroko: 'Taroko', hualien: 'Hualien', taitung: 'Taitung', kaohsiung: 'Kaohsiung' };
function board(x, y, w, h) {
  lctx.fillStyle = PAL_HEX[C.g]; lctx.fillRect(x - 1, y + h, 2, 9);
  lctx.fillStyle = PAL_HEX[C.k]; lctx.fillRect(x - (w >> 1) - 1, y - 1, w + 2, h + 2);
  lctx.fillStyle = PAL_HEX[C.w]; lctx.fillRect(x - (w >> 1), y, w, h);
  lctx.fillStyle = PAL_HEX[C.f]; lctx.fillRect(x - (w >> 1) + 1, y + 1, w - 2, h - 2);
}
function drawSign(f) {
  const d = f.d0 - 6, y0 = SY(d);
  if (y0 < -40 || y0 > H + 20) return;
  const bx = baseX(d);
  for (let i = 0; i < f.n; i++) {
    const b = f.br[i];
    const x = SX(bx + (i - (f.n - 1) / 2) * (f.gate ? (f.n === 3 ? 52 : 50) : 42));
    if (f.gate) {
      const en = textSpr(SIGN_NAME[b.dest], 'w'), zh = textSpr(REG[b.dest].zh, 'Y');
      const w = Math.max(en.width, zh.width + 14) + 4, h = 30, y = y0 - h - 6;
      board(x, y, w, h);
      lctx.drawImage(en, x - (en.width >> 1), y + 1);
      lctx.drawImage(zh, x - ((zh.width + 13) >> 1), y + 14);
      dspr(b.spec, x + ((zh.width + 13) >> 1) - 6, y + 21);
    } else {
      const w = 36, h = 24, y = y0 - h - 6;
      board(x, y, w, h);
      if (f.reveal) {
        drawDigits(lctx, 'x' + b.count, x - 6, y + 4, PAL_HEX[C.Y], false);
        dspr('ico_snack', x + 10, y + 6);
        drawDigits(lctx, String(b.hazN), x - 8, y + 15, PAL_HEX[C.R], false);
        dspr('ico_hazard', x - 1, y + 17);
        if (b.stormy) dspr('ico_storm', x + 11, y + 17);
      } else {
        for (let k = 0; k < b.level; k++) dspr('ico_snack', x + (k - (b.level - 1) / 2) * 10, y + 6);
        const icons = [];
        if (b.spec) icons.push(b.spec);
        if (b.stormy) icons.push('ico_storm');
        icons.forEach((id, k) => dspr(id, x + (k - (icons.length - 1) / 2) * 13, y + 17));
      }
    }
  }
}
function drawOverhead(top, bot) {
  const t = G.t;
  for (const f of G.forks) if (f.d0 - 6 < top + 40 && f.d0 > bot) drawSign(f);
  for (const o of G.overhead) {
    if (o.d > top + 60 || o.d < bot - 40) continue;
    const y = SY(o.d);
    if (o.type === 'arch') {
      roadsAt(o.d);
      const cx = SX(RD[0]), hw = Math.round(RD[1]);
      const en = textSpr(REG[o.id].en.toUpperCase(), 'w'), zh = textSpr(REG[o.id].zh, 'Y');
      const w = Math.max(en.width, zh.width) + 8;
      lctx.fillStyle = PAL_HEX[C.g]; lctx.fillRect(cx - hw - 2, y - 26, 2, 28); lctx.fillRect(cx + hw, y - 26, 2, 28);
      lctx.fillRect(cx - hw - 2, y - 22, hw * 2 + 4, 2);
      board(cx, y - 32, w, 28);
      lctx.drawImage(en, cx - (en.width >> 1), y - 31); lctx.drawImage(zh, cx - (zh.width >> 1), y - 18);
    } else if (o.type === 'lanterns') {
      roadsAt(o.d);
      let L = 1e9, R = -1e9;
      for (let i = 0; i < RN; i++) { L = Math.min(L, RD[i * 3] - RD[i * 3 + 1]); R = Math.max(R, RD[i * 3] + RD[i * 3 + 1]); }
      const a = SX(L) - 3, b = SX(R) + 3;
      lctx.fillStyle = PAL_HEX[C.v];
      for (let x = a; x <= b; x++) { const k = (x - a) / Math.max(1, b - a); lctx.fillRect(x, y - 18 + Math.round(Math.sin(k * Math.PI) * 4), 1, 1); }
      for (let x = a + 6; x < b - 3; x += 11) { const k = (x - a) / Math.max(1, b - a); dspr('lantern', x, y - 13 + Math.round(Math.sin(k * Math.PI) * 4) + Math.round(Math.sin(t * 2 + x) * .6)); }
    } else if (o.type === 'balloon') {
      const x = SX(o.x + Math.sin(t * .4 + o.ph) * 12), bob = Math.round(Math.sin(t + o.ph) * 2);
      lctx.fillStyle = 'rgba(24,20,37,.3)'; lctx.fillRect(x + 6, y + 6, 8, 3);
      dspr('balloon', x, y - 30 + bob, o.slots);
    }
  }
  if (G.drone > 0) {
    const p = G.p, a = t * 4;
    dspr(((t * 20 | 0) & 1) ? sprOr('drone2', 'drone') : 'drone', SX(p.x + Math.cos(a) * 16), SY(p.d) - 12 + Math.round(Math.sin(a) * 6));
  }
}
function drawParts() {
  for (const q of G.parts) {
    if (q.life <= 0) continue;
    const x = SX(q.x), y = SY(q.d) - Math.round(q.z);
    if (q.kind === 'kick') { dspr('kick', x, y - 4); continue; }
    if (q.kind === 'sparkle') { dspr(((G.t * 10 | 0) & 1) ? sprOr('sparkle2', 'sparkle') : 'sparkle', x, y); continue; }
    if (q.kind === 'blown') { dsprRot('por_' + q.id, x, y, q.life * 9); continue; }
    lctx.fillStyle = q.col; lctx.fillRect(x, y, 1, 1);
  }
  for (const q of G.pops) {
    const y = SY(q.d) - Math.round(q.t * 26);
    drawDigits(lctx, q.txt, SX(q.x), y, q.col, true);
  }
}

/* ---------- Typhoon Hangry ---------- */
function drawStorm() {
  const t = G.t, s = G.storm;
  const front = PY + (pdI - Math.round(s.d));
  const top = Math.max(0, Math.min(H - 4, front - 8));
  stormBuf.fill(0, 0);
  const cx0 = W / 2, cy0 = front + 70;
  for (let y = top; y < H; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const edge = front > H - 4
        ? H - 3 + Math.sin(x * .3 + t * 4)
        : front + 3 * Math.sin(x * .2 + t * 3) + 2 * Math.sin(x * .53 - t * 4.4) + 3 * Math.sin(x * .09 - t * 1.3);
      if (y < edge) continue;
      const dy = y - cy0, dx = x - cx0, r = Math.sqrt(dx * dx + dy * dy);
      const v = Math.sin(Math.atan2(dy, dx) * 2 + r * .14 - t * 2.2) + .5 * Math.sin(r * .3 + t * 3);
      let c = y - edge < 2 ? C.G : v > .8 ? C.g : v > .15 ? C.N : v > -.5 ? C.n : (hash2(x, y) < .5 ? C.P : C.k);
      if (((x + y * 2 + (t * 90 | 0)) % 17) === 0) c = C.G;
      stormBuf[row + x] = PAL32[c];
    }
  }
  stormCtx.putImageData(stormImg, 0, 0, 0, top, W, H - top);
  if (s.glitch > 0) {
    for (let k = 0; k < 6; k++) { const yy = top + (mr() * (H - top) | 0), hh = 2 + (mr() * 6 | 0); lctx.drawImage(stormCv, 0, yy, W, hh, (mr() - .5) * 10, yy, W, hh); }
  }
  lctx.drawImage(stormCv, 0, top, W, H - top, 0, top, W, H - top);
  if (G.bolt && front < H) {
    lctx.fillStyle = PAL_HEX[C.Y];
    let x = G.bolt.x | 0;
    for (let y = Math.max(front, 0); y < H; y += 3) { x += Math.round((hash2(x, y) - .5) * 6); lctx.fillRect(x, y, 1, 3); }
  }
  // the face
  if (front < H - 8) {
    const fx = Math.round(cx0 + Math.sin(t * .7) * 10), fy = front + 16;
    const lookX = clamp(Math.round((SX(G.p.x) - fx) / 30), -1, 1);
    const eye = (ex, flip) => {
      lctx.fillStyle = PAL_HEX[C.w]; lctx.fillRect(ex - 4, fy - 2, 9, 5);
      lctx.fillStyle = PAL_HEX[C.R]; lctx.fillRect(ex - 1 + lookX, fy - 1, 3, 3);
      lctx.fillStyle = PAL_HEX[C.k];
      for (let i = 0; i < 9; i++) lctx.fillRect(ex - 4 + i, fy - 4 + Math.round((flip ? 8 - i : i) * .35), 1, 2);
    };
    eye(fx - 12, false); eye(fx + 12, true);
    const chomp = s.munch > 0 ? Math.abs(Math.sin(t * 14)) : Math.abs(Math.sin(t * 4));
    const mh = 3 + Math.round(chomp * 7), mw = 30, my = fy + 7;
    lctx.fillStyle = PAL_HEX[C.k]; lctx.fillRect(fx - mw / 2, my, mw, mh);
    lctx.fillStyle = PAL_HEX[C.r]; lctx.fillRect(fx - mw / 2 + 3, my + mh - 2, mw - 6, 2);
    lctx.fillStyle = PAL_HEX[C.w];
    for (let i = 0; i < 6; i++) { lctx.fillRect(fx - mw / 2 + 2 + i * 5, my, 3, 2); lctx.fillRect(fx - mw / 2 + 3 + i * 5, my + 2, 1, 1); }
    if (s.glitch > 0) dspr('glitch', fx + (mr() - .5) * 30, fy + (mr() - .5) * 10);
  }
}
</script>
