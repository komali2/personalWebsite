<script>
'use strict';
/* =========================================================================
   Effects: particles, damage numbers, hit reactions, super cut-in
   ========================================================================= */
const quiet = () => state === 'sim';
function shake(n) { if (!save.reduce && G) G.shake = Math.max(G.shake, n); }
function burst(x, y, n, cols, spd = 40) {
  if (quiet() || !G) return;
  for (let i = 0; i < n; i++) {
    const a = mr() * Math.PI * 2, v = spd * (.4 + mr());
    G.fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, g: 90, t: 0, life: .5 + mr() * .4, col: cols[i % cols.length], sz: mr() < .3 ? 2 : 1 });
  }
}
function cloud(x, y, n, cols, vx, vy) {
  if (quiet()) return;
  for (let i = 0; i < n; i++) G.fx.push({ x: x + (mr() - .5) * 20, y: y + (mr() - .5) * 10, vx: vx + (mr() - .5) * 20, vy: vy + (mr() - .5) * 20, g: -6, t: 0, life: .7 + mr() * .6, col: cols[i % cols.length], sz: 2 + (mr() * 2 | 0) });
}
function numAt(x, y, txt, col) { if (!quiet() && G) G.nums.push({ x, y, txt: String(txt), col, t: 0 }); }
const sideXY = f => f.side === 'foe' ? [W / 2, H * (f.farmer ? .3 : .38)] : [W / 2, H * .74];
function floatTxt(f, txt, col) { const [x, y] = sideXY(f); numAt(x + (mr() - .5) * 24, y, txt, col); }

function hitFx(f, o, d, opts) {
  if (quiet()) return;
  o.flash = opts.dot ? Math.max(o.flash, .05) : .14;
  const [x, y] = sideXY(o);
  const col = opts.dot ? (opts.kind === 'stink' ? C.Y : opts.kind === 'mist' ? C.e : opts.kind === 'zap' ? C.c : C.q) : o.side === 'me' ? C.R : C.w;
  numAt(x + (mr() - .5) * 30, y - (opts.dot ? 0 : 6), d, col);
  if (opts.dot) { if (opts.kind === 'mist') cloud(x, y + 10, 2, [C.l, C.e, C.G], 0, -10); return; }
  burst(x, y, opts.big ? 14 : 7, o.side === 'me' ? [C.R, C.w] : [C.w, C.Y, C.l], opts.big ? 70 : 45);
  if (o.side === 'me') {
    shake(opts.big ? 5 : 3);
    const fm = f.farmer && FARM[G.bush].dev;
    if (fm === 'dv_slipper' || (fm && f.move === 'smack')) SFX.smack(); else if (fm === 'dv_racket') SFX.zap(); else SFX.hurt();
  } else {
    if (opts.big) shake(3);
    SFX.hit(opts.big);
    if (o.farmer && opts.big && (!G.say) && chance(.35)) auntSay('hit' + ri(1, 3));
  }
}
function dodgeFx(o) { const [x, y] = sideXY(o); burst(x, y - 10, 6, [C.c, C.w], 30); }
function counterFx(o) {
  if (quiet()) return;
  SFX.stance(); G.slash = { t: 0 };
}
function moveFx(f, m) {
  if (quiet()) return;
  const me = f.side === 'me', [ox, oy] = sideXY(me ? G.B.foe : G.B.me), [sx, sy] = sideXY(f);
  switch (m) {
    case 'spray': case 'bomb': SFX.spray(); cloud(sx, sy - 10, 18, [C.Y, C.y, C.e], (ox - sx) * 1.6, (oy - sy) * 1.6); break;
    case 'web': case 'cocoon': SFX.web(); G.web = { t: 0, to: me ? 'foe' : 'me' }; break;
    case 'hop': SFX.hop(); break;
    case 'stance': SFX.stance(); break;
    case 'hornflip': case 'whip': case 'crush': SFX.special(); break;
    case 'zap': case 'sparks': case 'overcharge': case 'megazap': SFX.zap(); G.bolt = { t: 0 }; break;
    case 'mist': case 'blast': case 'fullspray': SFX.spray(); cloud(W * .7, H * .5, 26, [C.l, C.e, C.G, C.w], -50, 60); break;
    case 'toxic': case 'hairs': case 'swarm': SFX.special(); break;
  }
}
function foeSuperFx(f) {
  if (quiet()) return;
  SFX.super(); shake(4);
  if (f.farmer) auntSay('super' + (G.bush + 1));
  G.redAlert = { t: 0 };
}

function updateFx(dt) {
  if (G.shake) G.shake = Math.max(0, G.shake - dt * 18);
  if (G.cutin && (G.cutin.t += dt) > 1.2) G.cutin = null;
  for (const k of ['slash', 'web', 'bolt', 'redAlert']) if (G[k] && (G[k].t += dt) > .45) G[k] = null;
  if (G.fx.length) {
    for (const q of G.fx) { q.t += dt; q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
    G.fx = G.fx.filter(q => q.t < q.life);
  }
  if (G.nums.length) { for (const n of G.nums) n.t += dt; G.nums = G.nums.filter(n => n.t < .9); }
  // lingering clouds while a stink or mist DoT is ticking
  const B = G.B;
  if (B && !B.over && !quiet()) for (const f of [B.me, B.foe]) for (const d of f.dots) {
    if ((d.kind === 'stink' || d.kind === 'mist') && mr() < dt * 10) { const [x, y] = sideXY(f); cloud(x, y, 1, d.kind === 'stink' ? [C.Y, C.y] : [C.l, C.e], 0, -12); }
  }
}
function drawFx() {
  for (const q of G.fx) {
    lctx.globalAlpha = clamp(1 - q.t / q.life, 0, 1) * (q.sz > 1 ? .75 : 1);
    px(lctx, q.col, q.x, q.y, q.sz, q.sz);
  }
  lctx.globalAlpha = 1;
  const B = G.B;
  if (G.slash) { const k = G.slash.t / .45; lctx.globalAlpha = 1 - k; for (let i = -20; i <= 20; i++) { px(lctx, C.w, W / 2 + i * 1.5, H * .32 + i + k * 6, 2, 1); px(lctx, C.Y, W / 2 - i * 1.5, H * .34 + i, 1, 1); } lctx.globalAlpha = 1; }
  if (G.web) {
    const k = G.web.t / .45, [x, y] = G.web.to === 'foe' ? [W / 2, H * .36] : [W / 2, H * .74];
    lctx.globalAlpha = 1 - k * .6;
    for (let a = 0; a < 8; a++) { const ang = a / 8 * Math.PI * 2, r = 10 + k * 26; for (let i = 0; i < r; i += 2) px(lctx, C.w, x + Math.cos(ang) * i, y + Math.sin(ang) * i * .7); }
    lctx.globalAlpha = 1;
  }
  if (G.bolt && B) {
    const [fx, fy] = fistPos(G.t), tx = W / 2, ty = H * .72;
    let x = fx, y = fy;
    for (let i = 1; i <= 8; i++) { const nx = lerp(fx, tx, i / 8) + (mr() - .5) * 14, ny = lerp(fy, ty, i / 8); const n = Math.ceil(Math.hypot(nx - x, ny - y)); for (let k = 0; k < n; k++) px(lctx, (k & 1) ? C.c : C.w, lerp(x, nx, k / n), lerp(y, ny, k / n)); x = nx; y = ny; }
  }
  if (G.redAlert) { lctx.fillStyle = `rgba(228,59,68,${(.3 * (1 - G.redAlert.t / .45)).toFixed(3)})`; lctx.fillRect(0, 0, W, H); }
  for (const n of G.nums) {
    const s = textSpr(n.txt, PAL_KEYS[n.col], 'k');
    lctx.globalAlpha = clamp(1.6 - n.t * 1.8, 0, 1);
    lctx.drawImage(s, Math.round(n.x - s.width / 2), Math.round(n.y - 8 - n.t * 22 - (n.t < .12 ? (1 - n.t / .12) * 4 : 0)));
  }
  lctx.globalAlpha = 1;
}

/* ---------- super cut-in: portrait burst across the screen ---------- */
function startCutin(id) {
  if (quiet()) return;
  G.cutin = { id, t: 0 };
  SFX.super(); shake(5);
}
function drawCutin() {
  const c = G.cutin;
  if (!c) return;
  const b = BUGS[c.id], t = c.t;
  const inT = clamp(t / .18, 0, 1), outT = clamp((t - .9) / .3, 0, 1);
  const cy = Math.round(H * .3), hh = Math.round(30 * ss(inT) * (1 - outT));
  if (hh <= 0) return;
  // band
  lctx.fillStyle = PAL_HEX[C[b.col]]; lctx.fillRect(0, cy - hh, W, hh * 2);
  lctx.fillStyle = PAL_HEX[C[b.col2]]; lctx.fillRect(0, cy - hh, W, 2); lctx.fillRect(0, cy + hh - 2, W, 2);
  lctx.globalAlpha = .35;
  for (let i = 0; i < 18; i++) { const y = cy - hh + ((i * 37 + (t * 400 | 0)) % (hh * 2)); px(lctx, C.w, ((i * 53 + t * 900) % (W + 40)) - 40, y, 30, 1); }
  lctx.globalAlpha = 1;
  // portrait slides in
  const x = lerp(-60, W * .3, easeOut(t / .3)) + outT * W;
  lctx.save(); lctx.beginPath(); lctx.rect(0, cy - hh, W, hh * 2); lctx.clip();
  dsprCB('fr_' + c.id, x, cy + hh + 6, 1.6);
  lctx.restore();
  const nm = textSpr(N(b.su), 'w', 'k');
  lctx.drawImage(nm, Math.round(lerp(W + 10, W * .62 - nm.width / 2, easeOut((t - .08) / .3)) + outT * W), cy - 6);
}
</script>
