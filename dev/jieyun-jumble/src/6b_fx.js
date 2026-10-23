<script>
'use strict';
/* =========================================================================
   Effects: particles and floating score numbers (cosmetic only).
   ========================================================================= */
const FX = [];
function burst(x, y, n, kind) {
  if (save.reduce) n = Math.ceil(n / 4);
  for (let i = 0; i < n; i++) {
    const a = mr() * Math.PI * 2, v = 20 + mr() * 50;
    FX.push({ k: kind || 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, t: 0, life: .7 + mr() * .6,
      col: kind === 'confetti' ? pick(['R', 'Y', 'B', 'e', 'q', 'o', 'c']) : kind === 'heart' ? 'p' : pick(['Y', 'w', 'y']) });
  }
}
const pick = a => a[Math.floor(mr() * a.length)];
function floatText(x, y, str, col) { FX.push({ k: 'text', x, y, str, col: col || 'Y', t: 0, life: 1.4, vx: 0, vy: -14 }); }
function drawFx(dt) {
  for (const f of FX) { f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.k !== 'text') f.vy += 90 * dt; }
  for (let i = FX.length - 1; i >= 0; i--) if (FX[i].t >= FX[i].life) FX.splice(i, 1);
  for (const f of FX) {
    const a = 1 - f.t / f.life;
    if (f.k === 'text') { lctx.globalAlpha = Math.min(1, a * 2); drawDigits(lctx, f.str, f.x, f.y, P(f.col), true); lctx.globalAlpha = 1; continue; }
    if (f.k === 'heart') { dspr('fx_heart', f.x - 2, f.y - 2, 1, null, a); continue; }
    lctx.globalAlpha = a; rect(P(f.col), f.x, f.y, f.k === 'confetti' ? 2 : 1, f.k === 'confetti' ? 1 + (Math.floor(f.t * 10) % 2) : 1); lctx.globalAlpha = 1;
  }
}
</script>
