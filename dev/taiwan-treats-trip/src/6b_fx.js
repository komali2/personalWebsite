<script>
'use strict';
/* =========================================================================
   Ability cut-in (anime-style portrait burst) + screen-wide power effects
   ========================================================================= */
// mild full-screen tint while a power is active (Caleb already gets the slow-mo blue)
const FX_TINT = { jeremy: [99, 199, 77, .06], riley: [181, 80, 136, .07], caleb: [0, 153, 219, 0], lauren: [246, 117, 122, .07], rachel: [228, 59, 68, .06] };
const FX_RATE = { jeremy: 7, riley: 28, caleb: 8, lauren: 14, rachel: 20 }; // rain particles per second
const HEART = ['01010', '11111', '11111', '01110', '00100'];

function abilityLeft() {
  switch (G.lead) {
    case 'jeremy': return G.drone;
    case 'riley': return G.storm.glitch;
    case 'caleb': return G.cool;
    case 'lauren': return G.whimsy;
    case 'rachel': return G.kung;
  }
  return 0;
}
function startCutin() {
  if (G.demo) return;
  G.cutin = { id: G.lead, t: 0 };
  // seed the power's rain so it is visible right away
  for (let i = 0; i < 22; i++) { const q = spawnFx(G.lead); q.y = mr() * q.end * .7; q.t = .3; G.fx.push(q); }
  AU.noise(.4, .12, 700, 'bandpass', 0, 5000);
}
function spawnFx(id) {
  const q = { k: id, x: mr() * W, y: -6 - mr() * 12, vx: 0, vy: 45 + mr() * 35, sw: 0, ph: mr() * 6, t: 0, end: H * (.38 + mr() * .34) };
  if (id === 'riley') { q.vy = 90 + mr() * 70; q.g = mr() < .5 ? '0' : '1'; q.col = mr() < .7 ? C.e : C.q; q.x = Math.round(q.x / 5) * 5; }
  else if (id === 'rachel') {
    q.petal = mr() < .3;
    if (q.petal) { q.vy = 35 + mr() * 20; q.sw = 14; q.col = mr() < .5 ? C.R : C.y; }
    else { q.vy = 170 + mr() * 130; q.len = 6 + mr() * 12 | 0; q.col = mr() < .65 ? C.w : C.y; }
  }
  else if (id === 'lauren') { q.sw = 16; q.col = [C.s, C.q, C.c, C.Y][mr() * 4 | 0]; q.heart = mr() < .55; }
  else if (id === 'caleb') { q.vy = 38 + mr() * 26; q.sw = 6; q.sh = mr() < .4; q.col = mr() < .5 ? C.c : C.w; }
  else if (id === 'jeremy') { q.vy = 32 + mr() * 24; q.sw = 10; q.dr = mr() < .45; }
  return q;
}
function updateFx(dt) {
  if (G.cutin && (G.cutin.t += dt) > 1.45) G.cutin = null;
  const on = abilityLeft() > 0;
  G.fxA = on ? Math.min(1, G.fxA + dt * 3) : Math.max(0, G.fxA - dt * 2);
  if (on && !G.demo) {
    G.fxAcc += dt * FX_RATE[G.lead];
    while (G.fxAcc >= 1) { G.fxAcc--; G.fx.push(spawnFx(G.lead)); }
  }
  if (!G.fx.length) return;
  for (const q of G.fx) { q.t += dt; q.y += q.vy * dt; q.x += (q.vx + Math.sin(q.t * 3 + q.ph) * q.sw) * dt; }
  G.fx = G.fx.filter(q => q.y < q.end);
}
// rain dissolves before reaching its (random) end line, never the bottom of the screen
const fxAlpha = q => .55 * (1 - ss((q.y / q.end - .5) / .5)) * Math.min(1, q.t * 5);

function viewfinder(a) {
  const top = Math.round(H * .2), bot = Math.round(H * .78), l = 6, r = W - 7, n = 10;
  lctx.globalAlpha = .5 * a;
  lctx.fillStyle = PAL_HEX[C.e];
  for (const [x, y, dx, dy] of [[l, top, 1, 1], [r, top, -1, 1], [l, bot, 1, -1], [r, bot, -1, -1]]) {
    lctx.fillRect(dx > 0 ? x : x - n + 1, y, n, 1);
    lctx.fillRect(x, dy > 0 ? y : y - n + 1, 1, n);
  }
  lctx.fillStyle = PAL_HEX[C.e];
  lctx.globalAlpha = .045 * a;
  for (let y = 0; y < H; y += 3) lctx.fillRect(0, y, W, 1);
  lctx.globalAlpha = a * .8;
  if ((G.t * 2 | 0) & 1) { lctx.fillStyle = PAL_HEX[C.R]; lctx.fillRect(l + 3, top + 4, 3, 3); }
  const rec = textSpr('REC', 'R');
  lctx.drawImage(rec, l + 7, top + 1);
  lctx.globalAlpha = 1;
}
function drawPowerFx() {
  const a = G.fxA;
  if (a > 0) {
    const [r, g, b, k] = FX_TINT[G.lead];
    if (k) { lctx.fillStyle = `rgba(${r},${g},${b},${(k * a).toFixed(3)})`; lctx.fillRect(0, 0, W, H); }
    if (G.lead === 'jeremy') viewfinder(a);
  }
  for (const q of G.fx) {
    const al = fxAlpha(q);
    if (al < .02) continue;
    lctx.globalAlpha = al;
    const x = Math.round(q.x), y = Math.round(q.y);
    switch (q.k) {
      case 'riley': { const g = textSpr((q.t * 7 | 0) & 1 ? q.g : q.g === '0' ? '1' : '0', PAL_KEYS[q.col]); lctx.drawImage(g, x - 4, y - 8); break; }
      case 'rachel': lctx.fillStyle = PAL_HEX[q.col]; if (q.petal) { lctx.fillRect(x, y, 2, 1); lctx.fillRect(x + 1, y + 1, 1, 1); } else lctx.fillRect(x, y, 1, q.len); break;
      case 'lauren':
        lctx.fillStyle = PAL_HEX[q.col];
        if (q.heart) { for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (HEART[j][i] === '1') lctx.fillRect(x + i, y + j, 1, 1); }
        else dspr(((q.t * 8 | 0) & 1) ? sprOr('sparkle2', 'sparkle') : 'sparkle', x, y);
        break;
      case 'caleb':
        if (q.sh) dspr('shades', x, y);
        else { lctx.fillStyle = PAL_HEX[q.col]; lctx.fillRect(x, y - 1, 1, 3); lctx.fillRect(x - 1, y, 3, 1); }
        break;
      case 'jeremy':
        if (q.dr) dspr(((q.t * 20 | 0) & 1) ? sprOr('drone2', 'drone') : 'drone', x, y);
        else { lctx.fillStyle = PAL_HEX[C.e]; lctx.fillRect(x - 2, y, 5, 1); lctx.fillRect(x, y - 2, 1, 5); }
        break;
    }
  }
  lctx.globalAlpha = 1;
}

/* ---------- the cut-in ---------- */
const easeOutBack = k => 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2);
function ring(cx, cy, r, col) {
  lctx.fillStyle = col;
  const n = Math.max(12, Math.round(r * 6.3));
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; lctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1); }
}
function drawCutin() {
  const c = G.cutin;
  if (!c) return;
  const t = c.t, f = FRIENDS[c.id];
  const inT = clamp(t / .28, 0, 1), outT = clamp((t - 1.1) / .32, 0, 1), vis = 1 - outT;
  const cx = W >> 1, cy0 = Math.round(H * .19);
  const cy = Math.round(lerp(-34, cy0, easeOutBack(inT)) - ss(outT) * 60 + Math.sin(t * 10) * (1 - outT) * 1.2);
  const col = PAL_HEX[C[f.col]], col2 = PAL_HEX[C[f.col2]];

  // slanted band with streaking speed lines
  const bh = 17, bandA = .55 * vis * Math.min(1, inT * 2);
  lctx.globalAlpha = bandA;
  lctx.fillStyle = col2;
  for (let y = -bh; y <= bh; y++) { const off = Math.round(y * .45); lctx.fillRect(-4 + off, cy + y, W + 8, 1); }
  lctx.fillStyle = col;
  lctx.fillRect(0, cy - bh - 1, W, 1); lctx.fillRect(0, cy + bh + 1, W, 1);
  lctx.globalAlpha = .7 * vis;
  lctx.fillStyle = PAL_HEX[C.w];
  for (let i = 0; i < 14; i++) {
    const y = cy - bh + 2 + (hash2(i, 9) * (bh * 2 - 3) | 0), len = 8 + (hash2(i, 4) * 20 | 0);
    const x = ((hash2(i, 2) * (W + 80) - t * (380 + hash2(i, 5) * 260)) % (W + 80) + W + 80) % (W + 80) - 40;
    lctx.fillRect(Math.round(x), y, len, 1);
  }
  // rotating rays + expanding rings + twinkles
  lctx.globalAlpha = vis;
  const rays = 12, rOut = 20 + 9 * inT;
  for (let i = 0; i < rays; i++) {
    const a = i / rays * Math.PI * 2 + t * 1.8;
    lctx.fillStyle = i & 1 ? PAL_HEX[C.Y] : col;
    for (let r = 15; r < rOut + (i & 1 ? 0 : 5); r += 1.5) lctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1);
  }
  if (t < .7) { lctx.globalAlpha = vis * (1 - t / .7); ring(cx, cy, 12 + t * 90, PAL_HEX[C.w]); ring(cx, cy, 8 + t * 55, PAL_HEX[C.Y]); }
  lctx.globalAlpha = vis;
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2 - t * 2.4, r = 27 + Math.sin(t * 6 + i) * 3;
    if ((t * 10 + i) % 2 < 1.3) dspr(((t * 12 + i | 0) & 1) ? sprOr('sparkle2', 'sparkle') : 'sparkle', cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  // the portrait: 2x, framed, white flash on entry
  const s = 32;
  lctx.fillStyle = PAL_HEX[C.k]; lctx.fillRect(cx - s / 2 - 3, cy - s / 2 - 3, s + 6, s + 6);
  lctx.fillStyle = PAL_HEX[C.Y]; lctx.fillRect(cx - s / 2 - 2, cy - s / 2 - 2, s + 4, s + 4);
  lctx.fillStyle = col2; lctx.fillRect(cx - s / 2, cy - s / 2, s, s);
  const por = spr('por_' + c.id, null, false, t < .09 ? 'white' : undefined);
  if (por) lctx.drawImage(por, cx - s / 2, cy - s / 2, s, s);
  // name + power, sliding in from the right
  const lt = clamp((t - .12) / .25, 0, 1);
  const label = textSpr(LANG === 'zh' ? `${f.name}：${f.zh}！` : `${f.name}: ${f.ab}!`, 'Y', 'k');
  lctx.drawImage(label, Math.round(cx - label.width / 2 + (1 - easeOutBack(lt)) * 90), cy + s / 2 + 5);
  lctx.globalAlpha = 1;
}
</script>
