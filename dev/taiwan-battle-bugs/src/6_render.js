<script>
'use strict';
/* =========================================================================
   Rendering: low-res canvas (about 168 px wide) scaled up by an integer factor.
   Over-the-shoulder view: your bug's back fills the bottom, the bush rises above.
   ========================================================================= */
let W = 168, H = 360, cv, ctx, low, lctx, scale = 4, dpr = 1, sceneCv, sctx;
function setupCanvas() {
  cv = document.getElementById('game'); ctx = cv.getContext('2d');
  low = document.createElement('canvas'); lctx = low.getContext('2d');
  sceneCv = document.createElement('canvas'); sctx = sceneCv.getContext('2d');
  resize();
}
function resize() {
  const r = document.getElementById('frame').getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  const dw = Math.max(1, Math.round(r.width * dpr)), dh = Math.max(1, Math.round(r.height * dpr));
  scale = Math.max(2, Math.round(dw / 168));
  W = Math.ceil(dw / scale); H = Math.ceil(dh / scale);
  cv.width = dw; cv.height = dh;
  low.width = W; low.height = H; sceneCv.width = W; sceneCv.height = H;
  bgCache.clear(); folCache.clear();
}

/* ---------- sprite helpers ---------- */
function dspr(id, x, y, s = 1, mode, flip, c = lctx) {
  const im = spr(id, null, flip, mode);
  if (!im) { if (DEBUG) { c.fillStyle = '#f0f'; c.fillRect(x, y, 8, 8); } return null; }
  if (s === 1) c.drawImage(im, Math.round(x), Math.round(y));
  else {
    c.imageSmoothingEnabled = s < 1;
    c.drawImage(im, Math.round(x), Math.round(y), Math.max(1, Math.round(im.width * s)), Math.max(1, Math.round(im.height * s)));
    c.imageSmoothingEnabled = false;
  }
  return im;
}
// anchored at center-bottom
function dsprCB(id, cx, by, s = 1, mode, flip, c = lctx) {
  const im = spr(id); if (!im) return null;
  return dspr(id, cx - im.width * s / 2, by - im.height * s, s, mode, flip, c);
}
function dsprRot(id, cx, cy, s, ang, mode, alpha = 1) {
  const im = spr(id, null, false, mode); if (!im) return;
  lctx.save(); lctx.globalAlpha = alpha; lctx.translate(Math.round(cx), Math.round(cy)); lctx.rotate(ang);
  lctx.drawImage(im, -im.width * s / 2, -im.height * s / 2, im.width * s, im.height * s);
  lctx.restore();
}
// sprite with a 1px dark outline, so it reads against busy foliage
function dsprOutCB(id, cx, by, s = 1, c = lctx) {
  for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) dsprCB(id, cx + ox, by + oy, s, 'black', false, c);
  return dsprCB(id, cx, by, s, null, false, c);
}
const silCv = document.createElement('canvas');
function silOf(src) {
  silCv.width = src.width; silCv.height = src.height;
  const x = silCv.getContext('2d'); x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-in'; x.fillStyle = PAL_HEX[0]; x.fillRect(0, 0, src.width, src.height); x.globalCompositeOperation = 'source-over';
  return silCv;
}
const px = (c, col, x, y, w = 1, h = 1) => { c.fillStyle = PAL_HEX[col]; c.fillRect(Math.round(x), Math.round(y), w, h); };
function disc(c, x, y, r, col) {
  c.fillStyle = PAL_HEX[col];
  const R = Math.ceil(r);
  for (let dy = -R; dy <= R; dy++) {
    const w = Math.sqrt(Math.max(0, r * r - dy * dy));
    if (w < .3) continue;
    c.fillRect(Math.round(x - w), Math.round(y + dy), Math.max(1, Math.round(2 * w)), 1);
  }
}
// tapered branch along a quadratic bezier, with outline and a top-left highlight
function branch(c, x0, y0, cx, cy, x1, y1, r0, r1, cols) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.3);
  const at = t => [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1];
  for (const [pad, col, off] of [[1, cols[0], 0], [0, cols[1], 0], [-.55, cols[2], -.35]]) {
    for (let i = 0; i <= n; i++) {
      const t = i / n, [x, y] = at(t), r = lerp(r0, r1, t);
      disc(c, x + off * r, y + off * r * .3, Math.max(.5, r + pad * (pad < 0 ? r : 1)), col);
    }
  }
}

/* ---------- sky, hills and tea terraces (cached per bush) ---------- */
const TOD = [
  { sky: ['P', 'q', 's', 'T', 't'], far: 'g', near: 'N', hedge: ['E', 'e', 'f'], sun: ['Y', 't'], sunAt: [.76, .3, 9], mist: .35 },
  { sky: ['b', 'B', 'B', 'c', 'l'], far: 'G', near: 'g', hedge: ['e', 'Y', 'E'], sun: ['w', 'Y'], sunAt: [.24, .07, 7], mist: 0 },
  { sky: ['n', 'P', 'q', 'o', 'y'], far: 'P', near: 'v', hedge: ['f', 'E', 'F'], sun: ['o', 'y'], sunAt: [.62, .35, 13], mist: .15 },
];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bgCache = new Map();
function bgCanvas(bush) {
  const key = bush + '|' + W + 'x' + H;
  if (bgCache.has(key)) return bgCache.get(key);
  const P = TOD[bush], c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), im = x.createImageData(W, H), u = new Uint32Array(im.data.buffer);
  const hz = H * .5, n = P.sky.length - 1;
  const [sx, sy, sr] = [P.sunAt[0] * W, P.sunAt[1] * H, P.sunAt[2]];
  const far = X => H * .3 + Math.sin(X * .045 + bush) * 7 + Math.sin(X * .013 + 2) * 12;
  const near = X => H * .39 + Math.sin(X * .03 + 4 + bush) * 6 + Math.sin(X * .09) * 2;
  const hill = X => H * .45 + Math.sin(X * .018 + 1 + bush * 2) * 9 + Math.sin(X * .05) * 3;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    let col;
    const th = BAYER[(j & 3) * 4 + (i & 3)] / 16;
    if (j >= hill(i)) {
      // tea terraces: hedge rows that widen toward the viewer
      const v = Math.sqrt(j - hill(i)) * 1.7, k = Math.floor(v), fr = v - k;
      const bump = Math.sin(i * .5 + k * 1.7) > .6 ? .08 : 0;
      col = fr < .12 + bump ? C[P.hedge[1]] : fr < .72 ? C[P.hedge[0]] : C[P.hedge[2]];
      if (j - hill(i) > H * .06 && fr >= .72) col = DARK[col];
    } else if (j >= near(i)) col = C[P.near];
    else if (j >= far(i)) col = C[P.far];
    else {
      const d = Math.hypot(i - sx, j - sy);
      if (d < sr) col = C[P.sun[0]];
      else if (d < sr + 3 && th < .5) col = C[P.sun[1]];
      else {
        const t = clamp(j / hz, 0, 1) * n, k = Math.min(n - 1, Math.floor(t));
        col = C[P.sky[(t - k) > th ? k + 1 : k]];
      }
    }
    // morning / evening haze over the hills
    if (P.mist && j > H * .27 && j < H * .5 && th < P.mist * (1 - Math.abs(j - H * .4) / (H * .12))) col = C.l;
    u[j * W + i] = PAL32[col];
  }
  x.putImageData(im, 0, 0);
  bgCache.set(key, c);
  return c;
}

/* ---------- the bush around you (cached per fork) ---------- */
const folCache = new Map();
const BASE = () => [W / 2, H * .66];
function tipXY(b) { return [b.x * W, b.y * H]; }
function foliage(seed, withBranches) {
  const key = seed + '|' + (withBranches ? 'f' : 'n') + '|' + W + 'x' + H + '|' + G.bush;
  if (folCache.has(key)) return folCache.get(key);
  if (folCache.size > 12) folCache.clear();
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  const r = mulberry32(seed), R = (a, b) => a + (b - a) * r();
  const night = G.bush === 2;
  // back twigs
  for (let i = 0; i < 3; i++) {
    const x0 = R(0, W), y0 = R(H * .6, H), x1 = x0 + (x0 < W / 2 ? -1 : 1) * R(30, 70), y1 = R(H * .2, H * .45);
    branch(x, x0, y0, (x0 + x1) / 2 + R(-20, 20), (y0 + y1) / 2, x1, y1, 2, .6, ['v', 'v', 'U'].map(k => DARK[C[k]]));
  }
  // back leaves (dark), edges and bottom
  for (let i = 0; i < 70; i++) {
    const side = r() < .5, edge = r() < .65;
    const lx = edge ? (side ? R(-14, W * .26) : R(W * .7, W)) : R(-10, W), ly = edge ? R(H * .08, H) : R(H * .62, H);
    dspr(r() < .5 ? 'lf1' : 'lf2', lx, ly, 1, 'dark', r() < .5, x);
  }
  if (withBranches) {
    const fk = G.fork, [bx, by] = BASE();
    const cols = night ? ['v', 'U', 'u'] : ['v', 'U', 'z'];
    branch(x, W / 2, H + 10, W / 2 + 4, H * .8, bx, by, 9, 7, cols.map(k => C[k]));
    for (const b of fk.br) {
      const [tx, ty] = tipXY(b);
      const cx = bx + (tx - bx) * .15 + b.cx * W, cy = by - (by - ty) * .78;
      branch(x, bx, by, cx, cy, tx, ty + 6, 6.5, 1.6, cols.map(k => C[k]));
      // a few side leaves along the branch
      for (let k = 0; k < 3; k++) {
        const t = .35 + k * .18, X = (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * cx + t * t * tx, Y = (1 - t) * (1 - t) * by + 2 * (1 - t) * t * cy + t * t * (ty + 6);
        dspr('lf1', X + (k % 2 ? 2 : -20), Y - 8, 1, k === 1 ? 'dark' : null, k % 2 === 0, x);
      }
    }
  }
  // front framing leaves, big and close
  for (let i = 0; i < 16; i++) {
    const side = i % 2 === 0;
    const lx = side ? R(-24, W * .1) : R(W * .76, W - 8), ly = R(H * .2, H * .95);
    dspr(r() < .6 ? 'lf1' : 'lf2', lx, ly, 2, null, side ? r() < .3 : r() < .7, x);
  }
  folCache.set(key, c);
  return c;
}

/* ---------- fork view ---------- */
function drawFork(c, t, yOff = 0) {
  c.drawImage(bgCanvas(G.bush), 0, 0);
  c.drawImage(foliage(G.fork.seed, true), 0, Math.round(yOff));
  const spider = G.bug === 'spider';
  G.fork.br.forEach((b, i) => {
    const [tx, ty0] = tipXY(b), ty = ty0 + yOff + Math.sin(t * 1.6 + b.sway) * .8;
    const hov = G.hover === i && G.phase === 'fork';
    const leaf = 'lf' + b.stars;
    const im = spr(leaf);
    const ls = hov ? 1.25 : 1;
    if (im) {
      // 3★ buds glow
      if (b.stars === 3 && ((t * 3 | 0) % 2)) disc(c, tx, ty - im.height * ls / 2, 12, C.Y);
      dsprOutCB(leaf, tx, ty + 4, ls, c);
    }
    // stars above
    const n = b.stars, sw = 8;
    for (let k = 0; k < n; k++) dspr('ic_star', tx - (n * sw) / 2 + k * sw + 1, ty - (im ? im.height * ls : 14) - 6, 1, null, false, c);
    // guard silhouette, sized relative to you and to the distance
    const gd = b.guard;
    if (gd && (!gd.hidden || spider)) {
      const s = Math.max(.3, relScale(gd.id) * .5), gx = tx + (i === 0 ? 10 : i === G.fork.br.length - 1 ? -10 : 12);
      const mode = spider ? (gd.hidden ? 'dark' : null) : 'black';
      dsprCB('fr_' + gd.id, gx, ty + 7 + Math.sin(t * 3 + i) * .6, s, mode, false, c);
      if (gd.elite) { const bang = spr('ic_bang'); if (bang && (t * 4 | 0) % 2) dspr('ic_bang', gx - 4, ty - 26, 1, null, false, c); }
      if (spider && gd.hidden) dspr('ic_bang', gx - 4, ty - 22, 1, null, false, c);
    }
    if (hov) { const y = ty + 8; px(c, C.Y, tx - 6, y, 12, 1); }
  });
}

/* ---------- close-up: the leaf you arrived at, maybe with a guard ---------- */
const LEAF_C = () => [W / 2, H * .53];
const leafCv = document.createElement('canvas');
function leafWithBites(id) {
  const im = spr(id); if (!im) return null;
  leafCv.width = im.width; leafCv.height = im.height;
  const x = leafCv.getContext('2d');
  x.clearRect(0, 0, im.width, im.height); x.drawImage(im, 0, 0);
  x.globalCompositeOperation = 'destination-out';
  for (const b of G.bite) { x.beginPath(); x.arc(b.x * im.width, b.y * im.height, b.r, 0, 7); x.fill(); }
  x.globalCompositeOperation = 'source-over';
  return leafCv;
}
function addBite(i) {
  G.bite.push({ x: [.55, .38, .7][i] + mr() * .1, y: [.1, .2, .3][i] + mr() * .1, r: 3.5 + i });
  const [lx, ly] = LEAF_C();
  burst(lx + rf(-10, 10), ly - 30, 6, [C.e, C.E, C.Y]);
}
function drawNear(c, t) {
  c.drawImage(bgCanvas(G.bush), 0, 0);
  c.drawImage(foliage(G.fork.seed + 7, false), 0, 0);
  c.fillStyle = 'rgba(24,20,37,.38)'; c.fillRect(0, 0, W, H);
  const node = G.node, [lx, ly] = LEAF_C();
  // the twig you crawled up
  branch(c, W / 2, H + 10, W / 2 - 6, H * .75, lx, ly + 4, 9, 5, ['v', 'U', 'z'].map(k => C[k]));
  // the leaf (3x), growing in on arrival, eaten at the end
  const ar = G.phase === 'arrive' ? easeOut(G.pt / .35) : 1;
  let ls = 3 * lerp(.55, 1, ar);
  let alpha = 1;
  if (G.phase === 'eat' && G.pt > .7) { const k = (G.pt - .7) / .35; ls *= 1 - .3 * k; alpha = 1 - k; }
  const lc = leafWithBites('lf' + node.stars);
  if (lc) {
    c.globalAlpha = clamp(alpha, 0, 1);
    const w = Math.round(lc.width * ls), h = Math.round(lc.height * ls), X = Math.round(lx - w / 2), Y = Math.round(ly - h + 6);
    const sil = silOf(lc);
    for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [2, 2]]) c.drawImage(sil, X + ox, Y + oy, w, h);
    c.drawImage(lc, X, Y, w, h);
    c.globalAlpha = 1;
  }
  const gd = node.guard;
  if (gd && (G.phase === 'arrive' || G.phase === 'fight')) drawFoe(c, t, gd);
}
function drawFoe(c, t, gd) {
  const B = G.B, f = B && B.foe, id = 'fr_' + gd.id, im = spr(id);
  if (!im) return;
  const [lx, ly] = LEAF_C();
  let s = relScale(gd.id), x = lx, y = ly - 2 + Math.sin(t * 3) * 1, mode = null, rot = 0, alpha = 1;
  if (G.phase === 'arrive') {
    const k = easeOut(G.pt / .45);
    if (gd.hidden) y -= (1 - k) * H * .6; else { s *= lerp(.4, 1, k); alpha = k; }
  }
  if (f) {
    if (f.wind > 0) { x += (mr() - .5) * 2; s *= 1.06; if ((t * 10 | 0) % 2) mode = 'red'; }
    if (f.anim === 'atk' && f.animT < .2) { const k = Math.sin(Math.PI * f.animT / .2); s *= 1 + .22 * k; y += 8 * k; }
    if (f.flash > 0) mode = 'white';
    if (B.over === 'win') { const k = B.endT; rot = k * 7; y += k * k * H * .8; alpha = 1 - k; }
  }
  if (rot) dsprRot(id, x, y - im.height * s / 2, s, rot, mode, clamp(alpha, 0, 1));
  else { c.globalAlpha = clamp(alpha, 0, 1); dsprCB(id, x, y, s, mode, false, c); c.globalAlpha = 1; }
  if (!f) return;
  const top = y - im.height * s;
  // statuses on the enemy
  if (f.stun > 0) for (let k = 0; k < 3; k++) { const a = t * 6 + k * 2.1; px(c, C.Y, x + Math.cos(a) * 12, top - 2 + Math.sin(a) * 3, 2, 2); }
  if (f.slowMul <= .5) { c.globalAlpha = .6; for (let k = -2; k <= 2; k++) px(c, C.w, x + k * 9, top + 4, 1, im.height * s - 8); px(c, C.w, x - 20, y - im.height * s * .5, 40, 1); c.globalAlpha = 1; }
  if (f.shield > 0) { c.globalAlpha = .4; disc(c, x, y - im.height * s / 2, im.width * s * .55, C.c); c.globalAlpha = 1; }
  if (f.stance > 0 && (t * 8 | 0) % 2) px(c, C.w, x + 10, top + 6, 3, 3);
}

/* ---------- Auntie ---------- */
const auntS = () => clamp(3 + (4.6 - BUGS[G.bug].size) * .45, 3, 4.5);
// 0 while she's here, 1 once she has given up and left
const auntGone = () => G.phase === 'won' ? 1 : G.phase === 'fOut' ? ss((G.pt - 1.6) / 1.2) : 0;
function fistPos(t) {
  const B = G.B, f = B && B.foe;
  let p = [W * .82, H * .5];
  if (f && f.farmer) {
    if (f.wind > 0) p = [W * .88 + (mr() - .5) * 2, H * .36 + (mr() - .5) * 2];
    else if (f.anim === 'atk' && f.animT < .45) {
      const k = f.animT < .12 ? f.animT / .12 : 1 - (f.animT - .12) / .33;
      const dev = FARM[G.bush].dev, d = spr(dev), dh = d ? d.height * auntS() * .8 : 0;
      const target = dev === 'dv_spray' ? [W * .7, H * .5] : [W * .55, H * .68 - dh];
      p = [lerp(W * .88, target[0], k), lerp(H * .36, target[1], k)];
    }
  }
  if (G.phase === 'fOut') { const g = auntGone(); p = [W * .7 + Math.sin(t * 9) * 4 * (1 - g), lerp(H * .3, H + 8 * auntS(), g)]; }
  return p;
}
function drawAunt(c, t) {
  c.drawImage(bgCanvas(G.bush), 0, 0);
  c.drawImage(foliage(G.fork.seed + 13, false), 0, 0);
  const S = auntS(), f = G.B && G.B.foe;
  let fy = H * .3 - 22 * S + Math.sin(t * 1.2) * 2;
  if (G.phase === 'fIntro') fy = lerp(-48 * S - 20, fy, easeOut(G.pt / 1.1));
  fy = Math.min(fy, H * .12);
  const gone = auntGone();
  fy = lerp(fy, -48 * S - 10, gone);
  const face = G.phase === 'fOut' || G.phase === 'won' ? 'au_tired' : (f && (f.rage || f.wind > 0)) || G.phase === 'dead' ? 'au_mad' : 'au_face';
  // her shadow darkens the whole bush
  c.fillStyle = `rgba(24,20,37,${(.28 * (1 - gone)).toFixed(3)})`; c.fillRect(0, 0, W, H);
  if (gone < 1) dspr(face, W / 2 - 28 * S + (f && f.flash > 0 ? 2 : 0), fy, S, null, false, c);
}
function drawArm(c, t) {
  if (G.phase !== 'fight' && G.phase !== 'fOut' && !(G.phase === 'fIntro' && G.pt > .8) && G.phase !== 'dead') return;
  if (!G.B && G.phase !== 'fOut' && G.phase !== 'fIntro') return;
  const S = auntS(), ds = S * .8, [fx, fy] = fistPos(t);
  const dev = G.phase === 'fOut' ? 'au_fan' : FARM[G.bush].dev;
  const d = spr(dev), a = spr('au_arm'), f = G.B && G.B.foe;
  if (d && a && f && f.farmer && G.phase === 'fight' && f.anim === 'atk' && f.animT < .45 && dev !== 'dv_spray') {
    // the swat: her arm comes down from above, device first
    dsprRot(dev, fx, fy + d.height * ds / 2, ds, Math.PI);
    dsprRot('au_arm', fx, fy - a.height * S / 2 + 6 * S, S, Math.PI);
    return;
  }
  if (dev === 'dv_spray' && d) dspr(dev, fx - (d.width - 6) * ds, fy - 14 * ds, ds, null, false, c);
  else if (d) dsprCB(dev, fx, fy + 3 * ds, dev === 'au_fan' ? S : ds, null, false, c);
  if (a) dspr('au_arm', fx - 12 * S, fy - 6 * S, S, null, false, c);
}

/* ---------- your bug, from behind ---------- */
function drawPlayer(t) {
  const id = 'bk_' + G.bug, im = spr(id);
  if (!im) return;
  const me = G.B && G.B.me;
  let s = 2, x = W / 2, by = H * .93 + Math.sin(t * 2.2) * 1, mode = null, rot = 0, alpha = 1;
  const ph = G.phase;
  if (ph === 'rush') by -= 5 * Math.sin(Math.PI * clamp(G.pt / RUSH(), 0, 1));
  if (ph === 'eat' && G.flag < 4) by -= 6 * Math.max(0, Math.sin((G.pt / .22) * Math.PI));
  if (me) {
    const k = me.animT;
    if ((me.anim === 'basic' || me.anim === 'special') && k < .24) by -= (me.anim === 'special' ? 16 : 10) * Math.sin(Math.PI * k / .24);
    if (me.anim === 'super' && k < .5) by -= 22 * Math.sin(Math.PI * k / .5);
    if (me.sp.id === 'hop' && me.evade > 0) by -= 16 + Math.sin(t * 12) * 2;
    if (me.flash > 0) { mode = 'red'; x += (mr() - .5) * 4; }
    if (me.stance > 0 && (t * 8 | 0) % 2) mode = 'white';
    if (me.stun > 0) x += Math.sin(t * 30) * 1.5;
  }
  if (ph === 'jump') {
    if (G.pt < .8) { const k = G.pt / .8; by -= k * H * .7; s = lerp(2, .7, k); }
    else { const k = easeOut((G.pt - .8) / .8); by += (1 - k) * 90; }
  }
  if (ph === 'dead') { const k = G.pt; rot = k * 2; by += k * k * 120; alpha = 1 - k * .4; }
  if (ph === 'won' || (ph === 'fOut' && G.pt > 1)) by -= Math.abs(Math.sin(t * 6)) * 8;
  if (rot) dsprRot(id, x, by - im.height, s, rot, null, clamp(alpha, 0, 1));
  else dsprCB(id, x, by, s, mode);
}

/* ---------- frame ---------- */
function render() {
  if (!G) { ctx.fillStyle = PAL_HEX[0]; ctx.fillRect(0, 0, cv.width, cv.height); return; }
  lctx.imageSmoothingEnabled = false;
  const t = G.t, ph = G.phase;
  const farmerScene = ph === 'fIntro' || ph === 'fOut' || ph === 'won' || (G.B && G.B.kind === 'farmer') || (ph === 'dead' && G.stats.killer === 'aunt');
  if (ph === 'fork') drawFork(lctx, t);
  else if (ph === 'next') { drawNear(lctx, t); lctx.globalAlpha = ss(G.pt / .35); drawFork(lctx, t, (1 - ss(G.pt / .35)) * -H * .2); lctx.globalAlpha = 1; }
  else if (ph === 'rush') {
    drawFork(sctx, t);
    const p = clamp(G.pt / RUSH(), 0, 1), e = p * p, b = G.fork.br[G.sel], [tx, ty] = tipXY(b);
    const s = 1 + 2.6 * e, X = lerp(tx, W / 2, e), Y = lerp(ty, H * .5, e);
    lctx.drawImage(sceneCv, Math.round(X - tx * s), Math.round(Y - ty * s), Math.round(W * s), Math.round(H * s));
    speedLines(p);
    lctx.fillStyle = `rgba(99,199,77,${(e * e * .5).toFixed(3)})`; lctx.fillRect(0, 0, W, H);
  } else if (farmerScene) drawAunt(lctx, t);
  else if (ph === 'jump') {
    if (G.pt < .8) { const k = G.pt / .8; lctx.drawImage(bgCanvas(G.bush), 0, 0); lctx.drawImage(foliage(G.fork.seed + 13, false), 0, Math.round(k * k * H)); }
    else drawFork(lctx, t, (1 - easeOut((G.pt - .8) / .8)) * -H * .5);
  } else drawNear(lctx, t);
  if (ph === 'dead') { lctx.fillStyle = `rgba(162,38,51,${(Math.min(1, G.pt) * .35).toFixed(3)})`; lctx.fillRect(0, 0, W, H); }
  drawPlayer(t);
  if (farmerScene) drawArm(lctx, t);
  drawFx();
  drawCutin();
  // blit, with screen shake
  const sh = save.reduce ? 0 : G.shake;
  const ox = sh ? Math.round((mr() - .5) * sh) * scale : 0, oy = sh ? Math.round((mr() - .5) * sh) * scale : 0;
  ctx.imageSmoothingEnabled = false;
  if (ox || oy) { ctx.fillStyle = PAL_HEX[0]; ctx.fillRect(0, 0, cv.width, cv.height); }
  ctx.drawImage(low, ox, oy, W * scale, H * scale);
}
function speedLines(p) {
  lctx.globalAlpha = .5 * p;
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2 + i, r0 = 30 + mr() * 20, r1 = r0 + 20 + p * 60;
    const cx = W / 2, cy = H * .5;
    const n = Math.round(r1 - r0);
    for (let k = 0; k < n; k += 2) px(lctx, C.w, cx + Math.cos(a) * (r0 + k), cy + Math.sin(a) * (r0 + k));
  }
  lctx.globalAlpha = 1;
}
</script>
